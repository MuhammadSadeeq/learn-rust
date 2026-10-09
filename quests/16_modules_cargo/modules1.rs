// ============================================================================
//  QUEST modules1 · Visibility        Chapter 16 · Modules, Crates & Tests
// ----------------------------------------------------------------------------
//  Items are private to their module unless marked pub. Here main builds an
//  Account with struct syntax and calls a helper in `bank`. rustc stops at the
//  private function first (E0603). Next, the tests report that Account::new
//  does not exist yet (E0599). Once `new` exists, main's struct literal is
//  rejected too, because the fields are private (E0451).
//
//  Give bank a public way to create an account, and make the function main
//  needs public. Keep the fields private. Only a constructor can guarantee
//  that every new account starts at zero. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

mod bank {
    pub struct Account {
        owner: String,
        balance: u64,
    }

    impl Account {
        pub fn deposit(&mut self, amount: u64) {
            self.balance += amount;
        }

        pub fn balance(&self) -> u64 {
            self.balance
        }
    }

    fn statement(account: &Account) -> String {
        format!("{} has {} cents", account.owner, account.balance)
    }
}

fn main() {
    let mut acct = bank::Account {
        owner: String::from("Ana"),
        balance: 100,
    };
    acct.deposit(50);
    println!("{}", bank::statement(&acct));
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
