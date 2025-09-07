#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, 
    token::Interface as TokenInterface, contracterror, panic_with_error
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NegativeAmount = 4,
    InsufficientBalance = 5,
    InsufficientAllowance = 6,
    OverflowError = 7,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Decimals,
    Name,
    Symbol,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address), // (from, spender)
    Initialized,
}

#[contract]
pub struct FKaleToken;

#[contractimpl]
impl TokenInterface for FKaleToken {
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }

    fn approve(env: Env, from: Address, spender: Address, amount: i128, _expiration_ledger: u32) {
        from.require_auth();

        if amount < 0 {
            panic_with_error!(&env, TokenError::NegativeAmount);
        }

        env.storage()
            .instance()
            .set(&DataKey::Allowance(from, spender), &amount);

        // TODO: Emit approval event when events are available
    }

    fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic_with_error!(&env, TokenError::NegativeAmount);
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // TODO: Emit transfer event when events are available
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        if amount < 0 {
            panic_with_error!(&env, TokenError::NegativeAmount);
        }

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));
        env.storage()
            .instance()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &(allowance - amount));

        // TODO: Emit transfer event when events are available
    }

    fn burn(env: Env, from: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount < 0 {
            panic_with_error!(&env, TokenError::NegativeAmount);
        }

        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(total_supply - amount));

        // TODO: Emit burn event when events are available
    }

    fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount < 0 {
            panic_with_error!(&env, TokenError::NegativeAmount);
        }

        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }

        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        let total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(total_supply - amount));
        env.storage()
            .instance()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &(allowance - amount));

        // TODO: Emit burn event when events are available
    }

    fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap_or(7)
    }

    fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .unwrap_or(String::from_str(&env, "Future KALE"))
    }

    fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .unwrap_or(String::from_str(&env, "fKALE"))
    }
}

#[contractimpl]
impl FKaleToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        decimals: u32,
        name: String,
        symbol: String,
    ) -> Result<(), TokenError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(TokenError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        env.storage().instance().set(&DataKey::Initialized, &true);

        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), TokenError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount < 0 {
            return Err(TokenError::NegativeAmount);
        }

        let balance = Self::balance(env.clone(), to.clone());
        let total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);

        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(balance + amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(total_supply + amount));

        // TODO: Emit mint event when events are available

        Ok(())
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), TokenError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        Ok(())
    }
}
