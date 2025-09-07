#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env,
    token::TokenClient, contracterror, IntoVal
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    PositionNotFound = 5,
    PositionNotMatured = 6,
    InsufficientKaleDeposited = 7,
    PositionAlreadyRedeemed = 8,
    PositionAlreadyLiquidated = 9,
    InsufficientBalance = 10,
}

#[contracttype]
pub struct ContractData {
    pub admin: Address,
    pub kale_sac: Address,
    pub xlm_sac: Address,
    pub fkale_token: Address,
    pub exchange_rate: i128,      // 1000 fKALE per 1 XLM
    pub lock_period_days: u64,    // 30 days default
}

#[contracttype]
pub struct UserPosition {
    pub user: Address,
    pub fkale_amount: i128,       // fKALE minted for user
    pub xlm_locked: i128,         // XLM collateral locked
    pub created_at: u64,          // Timestamp of position creation
    pub maturity_date: u64,       // When user can withdraw XLM
    pub kale_delivered: i128,     // KALE deposited for redemption
    pub status: u32,              // 0=active, 1=redeemed, 2=liquidated
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    ContractData,
    UserPosition(Address),
    TotalKaleAvailable,          // Total KALE available for redemption
}

#[contract]
pub struct ForwardsContract;

#[contractimpl]
impl ForwardsContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        kale_sac: Address,
        xlm_sac: Address,
        fkale_token: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::ContractData) {
            return Err(ContractError::AlreadyInitialized);
        }

        let contract_data = ContractData {
            admin,
            kale_sac,
            xlm_sac,
            fkale_token,
            exchange_rate: 1000, // 1000 fKALE per 1 XLM
            lock_period_days: 30, // 30 days lock period
        };

        env.storage().instance().set(&DataKey::ContractData, &contract_data);
        env.storage().instance().set(&DataKey::TotalKaleAvailable, &0i128);

        Ok(())
    }

    pub fn buy_fkale(env: Env, user: Address, xlm_amount: i128) -> Result<i128, ContractError> {
        user.require_auth();

        let contract_data: ContractData = env
            .storage()
            .instance()
            .get(&DataKey::ContractData)
            .ok_or(ContractError::NotInitialized)?;

        if xlm_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        // Calculate fKALE to mint (1000 fKALE per 1 XLM)
        let fkale_amount = xlm_amount * contract_data.exchange_rate;

        // Transfer XLM from user to contract
        let xlm_client = TokenClient::new(&env, &contract_data.xlm_sac);
        xlm_client.transfer_from(
            &env.current_contract_address(),
            &user,
            &env.current_contract_address(),
            &xlm_amount,
        );

        // Mint fKALE to user
        let _: () = env.invoke_contract(
            &contract_data.fkale_token,
            &soroban_sdk::symbol_short!("mint"),
            soroban_sdk::vec![&env, user.into_val(&env), fkale_amount.into_val(&env)],
        );

        // Create or update user position
        let current_time = env.ledger().timestamp();
        let maturity_date = current_time + (contract_data.lock_period_days * 24 * 60 * 60);

        let mut position = env
            .storage()
            .instance()
            .get(&DataKey::UserPosition(user.clone()))
            .unwrap_or(UserPosition {
                user: user.clone(),
                fkale_amount: 0,
                xlm_locked: 0,
                created_at: current_time,
                maturity_date,
                kale_delivered: 0,
                status: 0, // active
            });

        position.fkale_amount += fkale_amount;
        position.xlm_locked += xlm_amount;

        env.storage()
            .instance()
            .set(&DataKey::UserPosition(user.clone()), &position);

        Ok(fkale_amount)
    }

    pub fn deposit_kale_for_redemption(
        env: Env,
        user: Address,
        kale_amount: i128,
    ) -> Result<(), ContractError> {
        user.require_auth();

        let contract_data: ContractData = env
            .storage()
            .instance()
            .get(&DataKey::ContractData)
            .ok_or(ContractError::NotInitialized)?;

        if kale_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let mut position: UserPosition = env
            .storage()
            .instance()
            .get(&DataKey::UserPosition(user.clone()))
            .ok_or(ContractError::PositionNotFound)?;

        if position.status != 0 {
            return Err(ContractError::PositionAlreadyRedeemed);
        }

        // Transfer KALE from user to contract
        let kale_client = TokenClient::new(&env, &contract_data.kale_sac);
        kale_client.transfer_from(
            &env.current_contract_address(),
            &user,
            &env.current_contract_address(),
            &kale_amount,
        );

        // Update position
        position.kale_delivered += kale_amount;
        env.storage()
            .instance()
            .set(&DataKey::UserPosition(user.clone()), &position);

        // Update total KALE available
        let total_kale: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalKaleAvailable)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalKaleAvailable, &(total_kale + kale_amount));

        Ok(())
    }

    pub fn redeem_fkale(
        env: Env,
        user: Address,
        fkale_amount: i128,
    ) -> Result<i128, ContractError> {
        user.require_auth();

        let contract_data: ContractData = env
            .storage()
            .instance()
            .get(&DataKey::ContractData)
            .ok_or(ContractError::NotInitialized)?;

        if fkale_amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        // Check if contract has enough KALE
        let total_kale: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalKaleAvailable)
            .unwrap_or(0);

        if total_kale < fkale_amount {
            return Err(ContractError::InsufficientKaleDeposited);
        }

        // Check user has enough fKALE
        let fkale_client = TokenClient::new(&env, &contract_data.fkale_token);
        let user_fkale_balance = fkale_client.balance(&user);
        if user_fkale_balance < fkale_amount {
            return Err(ContractError::InsufficientBalance);
        }

        // Burn fKALE from user
        let _: () = env.invoke_contract(
            &contract_data.fkale_token,
            &soroban_sdk::symbol_short!("burn"),
            soroban_sdk::vec![&env, user.into_val(&env), fkale_amount.into_val(&env)],
        );

        // Transfer KALE to user (1:1 ratio)
        let kale_client = TokenClient::new(&env, &contract_data.kale_sac);
        kale_client.transfer(&env.current_contract_address(), &user, &fkale_amount);

        // Update total KALE available
        env.storage()
            .instance()
            .set(&DataKey::TotalKaleAvailable, &(total_kale - fkale_amount));

        Ok(fkale_amount)
    }

    pub fn withdraw_xlm(env: Env, user: Address) -> Result<i128, ContractError> {
        user.require_auth();

        let contract_data: ContractData = env
            .storage()
            .instance()
            .get(&DataKey::ContractData)
            .ok_or(ContractError::NotInitialized)?;

        let mut position: UserPosition = env
            .storage()
            .instance()
            .get(&DataKey::UserPosition(user.clone()))
            .ok_or(ContractError::PositionNotFound)?;

        if position.status != 0 {
            return Err(ContractError::PositionAlreadyRedeemed);
        }

        // Check if position has matured
        if env.ledger().timestamp() < position.maturity_date {
            return Err(ContractError::PositionNotMatured);
        }

        // Check if user has delivered enough KALE
        if position.kale_delivered < position.fkale_amount {
            return Err(ContractError::InsufficientKaleDeposited);
        }

        let xlm_to_return = position.xlm_locked;

        // Transfer XLM back to user
        let xlm_client = TokenClient::new(&env, &contract_data.xlm_sac);
        xlm_client.transfer(&env.current_contract_address(), &user, &xlm_to_return);

        // Mark position as redeemed
        position.status = 1; // redeemed
        env.storage()
            .instance()
            .set(&DataKey::UserPosition(user.clone()), &position);

        Ok(xlm_to_return)
    }

    pub fn liquidate_position(
        env: Env,
        admin: Address,
        user: Address,
    ) -> Result<i128, ContractError> {
        let contract_data: ContractData = env
            .storage()
            .instance()
            .get(&DataKey::ContractData)
            .ok_or(ContractError::NotInitialized)?;

        if admin != contract_data.admin {
            return Err(ContractError::Unauthorized);
        }

        admin.require_auth();

        let mut position: UserPosition = env
            .storage()
            .instance()
            .get(&DataKey::UserPosition(user.clone()))
            .ok_or(ContractError::PositionNotFound)?;

        if position.status != 0 {
            return Err(ContractError::PositionAlreadyLiquidated);
        }

        // Check if position has matured
        if env.ledger().timestamp() < position.maturity_date {
            return Err(ContractError::PositionNotMatured);
        }

        // Check if user failed to deliver enough KALE
        if position.kale_delivered >= position.fkale_amount {
            return Err(ContractError::InsufficientKaleDeposited); // User delivered enough, can't liquidate
        }

        let xlm_to_admin = position.xlm_locked;

        // Transfer XLM to admin
        let xlm_client = TokenClient::new(&env, &contract_data.xlm_sac);
        xlm_client.transfer(&env.current_contract_address(), &admin, &xlm_to_admin);

        // Mark position as liquidated
        position.status = 2; // liquidated
        env.storage()
            .instance()
            .set(&DataKey::UserPosition(user.clone()), &position);

        Ok(xlm_to_admin)
    }

    // View functions
    pub fn get_user_position(env: Env, user: Address) -> Option<UserPosition> {
        env.storage().instance().get(&DataKey::UserPosition(user))
    }

    pub fn can_withdraw_xlm(env: Env, user: Address) -> bool {
        if let Some(position) = env.storage().instance().get::<DataKey, UserPosition>(&DataKey::UserPosition(user)) {
            position.status == 0
                && env.ledger().timestamp() >= position.maturity_date
                && position.kale_delivered >= position.fkale_amount
        } else {
            false
        }
    }

    pub fn get_contract_data(env: Env) -> Option<ContractData> {
        env.storage().instance().get(&DataKey::ContractData)
    }

    pub fn get_total_kale_available(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalKaleAvailable)
            .unwrap_or(0)
    }
}