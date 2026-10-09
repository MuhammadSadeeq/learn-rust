// ============================================================================
//  SOLUTION modules1 · Visibility     Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  The constructor is the only way in from outside `bank`, so it enforces the
//  rule that balances start at zero. Only what main needs is pub. The fields
//  stay private, so nothing outside can set a balance directly.
// ============================================================================

mod bank {
    pub struct Account {
        owner: String,
        balance: u64,
    }

    impl Account {
        // Every account starts at zero. Outside code has no other way to build
        // an Account, because the fields are private.
        pub fn new(owner: &str) -> Account {
            Account {
                owner: owner.to_string(),
                balance: 0,
            }
        }

        pub fn deposit(&mut self, amount: u64) {
            self.balance += amount;
        }

        pub fn balance(&self) -> u64 {
            self.balance
        }
    }

    // `pub` makes this callable from outside the module.
    pub fn statement(account: &Account) -> String {
        format!("{} has {} cents", account.owner, account.balance)
    }
}

fn main() {
    let mut acct = bank::Account::new("Ana");
    acct.deposit(100);
    acct.deposit(50);
    println!("{}", bank::statement(&acct));
    println!("balance: {}", acct.balance());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_account_starts_at_zero() {
        let acct = bank::Account::new("Ana");
        assert_eq!(acct.balance(), 0, "a new account must start empty");
    }

    #[test]
    fn deposits_add_up() {
        let mut acct = bank::Account::new("Bo");
        acct.deposit(250);
        acct.deposit(50);
        assert_eq!(acct.balance(), 300);
    }

    #[test]
    fn statement_names_the_owner_and_balance() {
        let mut acct = bank::Account::new("Cy");
        acct.deposit(5);
        assert_eq!(bank::statement(&acct), "Cy has 5 cents");
    }
}
