// ============================================================================
//  SOLUTION boss3_ledger · Bank ledger         Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  Balances live in a HashMap, and each rule gets one small helper.
//  balance_mut finds an account or reports it missing, ensure_open checks that
//  an account exists, and withdraw checks the funds before it writes.
//  A transfer runs all of its checks first. If one fails, no balance has moved.
//  HashMap order is random, so top_accounts sorts the pairs itself.
// ============================================================================

use std::collections::HashMap;
use std::fmt;

#[derive(Debug)]
enum Transaction {
    Deposit {
        account: String,
        amount: u64,
    },
    Withdrawal {
        account: String,
        amount: u64,
    },
    Transfer {
        from: String,
        to: String,
        amount: u64,
    },
}

// PartialEq lets the tests compare errors with assert_eq!.
#[derive(Debug, PartialEq)]
enum LedgerError {
    UnknownAccount(String),
    InsufficientFunds {
        account: String,
        needed: u64,
        available: u64,
    },
}

impl fmt::Display for LedgerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LedgerError::UnknownAccount(name) => write!(f, "unknown account: {name}"),
            LedgerError::InsufficientFunds {
                account,
                needed,
                available,
            } => write!(
                f,
                "insufficient funds in {account}: needed {needed}, available {available}"
            ),
        }
    }
}

// Debug and Display are all this needs. The default methods of the trait are
// enough, so a LedgerError can flow through `?` into a Box<dyn Error>.
impl std::error::Error for LedgerError {}

#[derive(Debug, Default)]
struct Ledger {
    balances: HashMap<String, u64>,
}

impl Ledger {
    fn open(&mut self, name: &str) {
        // entry().or_insert(0) creates the account only when it is missing, so
        // opening an existing account keeps its money.
        self.balances.entry(name.to_string()).or_insert(0);
    }

    fn ensure_open(&self, name: &str) -> Result<(), LedgerError> {
        if self.balances.contains_key(name) {
            Ok(())
        } else {
            Err(LedgerError::UnknownAccount(name.to_string()))
        }
    }

    // A mutable handle to the balance, or the UnknownAccount error.
    fn balance_mut(&mut self, name: &str) -> Result<&mut u64, LedgerError> {
        self.balances
            .get_mut(name)
            .ok_or_else(|| LedgerError::UnknownAccount(name.to_string()))
    }

    fn deposit(&mut self, account: &str, amount: u64) -> Result<(), LedgerError> {
        *self.balance_mut(account)? += amount;
        Ok(())
    }

    fn withdraw(&mut self, account: &str, amount: u64) -> Result<(), LedgerError> {
        let balance = self.balance_mut(account)?;
        // Check before subtracting, so a refused withdrawal changes nothing.
        if *balance < amount {
            return Err(LedgerError::InsufficientFunds {
                account: account.to_string(),
                needed: amount,
                available: *balance,
            });
        }
        *balance -= amount;
        Ok(())
    }

    fn apply(&mut self, tx: &Transaction) -> Result<(), LedgerError> {
        match tx {
            Transaction::Deposit { account, amount } => self.deposit(account, *amount),
            Transaction::Withdrawal { account, amount } => self.withdraw(account, *amount),
            Transaction::Transfer { from, to, amount } => {
                // Every check runs before the first write. If one fails, the
                // error comes back and no balance has changed.
                self.ensure_open(from)?;
                self.ensure_open(to)?;
                self.withdraw(from, *amount)?;
                self.deposit(to, *amount)
            }
        }
    }

    fn apply_all(&mut self, txs: &[Transaction]) -> Vec<LedgerError> {
        // A failed transaction is recorded and skipped, and the rest still run.
        // .err() turns each Result into an Option, and filter_map keeps the Somes.
        txs.iter().filter_map(|tx| self.apply(tx).err()).collect()
    }

    fn top_accounts(&self, n: usize) -> Vec<(String, u64)> {
        let mut accounts: Vec<(String, u64)> = self
            .balances
            .iter()
            .map(|(name, balance)| (name.clone(), *balance))
            .collect();
        // HashMap order is random, so sort explicitly: biggest balance first,
        // then by name for ties.
        accounts.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
        accounts.truncate(n);
        accounts
    }

    fn total(&self) -> u64 {
        self.balances.values().sum()
    }
}

fn main() {
    let mut ledger = Ledger::default();
    for name in ["ana", "bo", "cy"] {
        ledger.open(name);
    }
    let txs = vec![
        Transaction::Deposit {
            account: "ana".into(),
            amount: 5_000,
        },
        Transaction::Deposit {
            account: "bo".into(),
            amount: 1_200,
        },
        Transaction::Transfer {
            from: "ana".into(),
            to: "cy".into(),
            amount: 2_000,
        },
        Transaction::Withdrawal {
            account: "bo".into(),
            amount: 1_500,
        },
        Transaction::Deposit {
            account: "dee".into(),
            amount: 10,
        },
    ];
    for error in ledger.apply_all(&txs) {
        println!("error: {error}");
    }
    for (name, balance) in ledger.top_accounts(3) {
        println!("{name}: {balance}");
    }
    println!("total: {}", ledger.total());
}

#[cfg(test)]
mod tests {
    use super::*;

    fn deposit(account: &str, amount: u64) -> Transaction {
        Transaction::Deposit {
            account: account.to_string(),
            amount,
        }
    }

    fn withdrawal(account: &str, amount: u64) -> Transaction {
        Transaction::Withdrawal {
            account: account.to_string(),
            amount,
        }
    }

    fn transfer(from: &str, to: &str, amount: u64) -> Transaction {
        Transaction::Transfer {
            from: from.to_string(),
            to: to.to_string(),
            amount,
        }
    }

    fn unknown(name: &str) -> LedgerError {
        LedgerError::UnknownAccount(name.to_string())
    }

    fn insufficient(account: &str, needed: u64, available: u64) -> LedgerError {
        LedgerError::InsufficientFunds {
            account: account.to_string(),
            needed,
            available,
        }
    }

    #[test]
    fn deposits_and_withdrawals_move_the_balance() {
        let mut ledger = Ledger::default();
        ledger.open("ana");
        ledger.apply(&deposit("ana", 500)).unwrap();
        ledger.apply(&withdrawal("ana", 120)).unwrap();
        assert_eq!(ledger.total(), 380);
        // Opening an account again must not reset its balance.
        ledger.open("ana");
        assert_eq!(ledger.top_accounts(1), vec![("ana".to_string(), 380)]);
    }

    #[test]
    fn unknown_account_fails_and_is_not_created() {
        let mut ledger = Ledger::default();
        assert_eq!(ledger.apply(&deposit("ghost", 5)), Err(unknown("ghost")));
        assert!(ledger.top_accounts(10).is_empty());
        assert_eq!(ledger.total(), 0);
    }

    #[test]
    fn overdraft_is_refused_and_changes_nothing() {
        let mut ledger = Ledger::default();
        ledger.open("ana");
        ledger.apply(&deposit("ana", 100)).unwrap();
        assert_eq!(
            ledger.apply(&withdrawal("ana", 150)),
            Err(insufficient("ana", 150, 100))
        );
        assert_eq!(ledger.total(), 100);
    }

    #[test]
    fn transfers_move_money_between_accounts() {
        let mut ledger = Ledger::default();
        ledger.open("ana");
        ledger.open("bo");
        ledger.apply(&deposit("ana", 200)).unwrap();
        ledger.apply(&transfer("ana", "bo", 75)).unwrap();
        assert_eq!(ledger.total(), 200);
        assert_eq!(
            ledger.top_accounts(2),
            vec![("ana".to_string(), 125), ("bo".to_string(), 75)]
        );
    }

    #[test]
    fn failed_transfers_move_no_money() {
        let mut ledger = Ledger::default();
        ledger.open("ana");
        ledger.open("bo");
        ledger.apply(&deposit("ana", 50)).unwrap();
        // Not enough money: the error names the sender, and bo gets nothing.
        assert_eq!(
            ledger.apply(&transfer("ana", "bo", 80)),
            Err(insufficient("ana", 80, 50))
        );
        // Missing destination: ana keeps her money.
        assert_eq!(
            ledger.apply(&transfer("ana", "zed", 10)),
            Err(unknown("zed"))
        );
        assert_eq!(
            ledger.top_accounts(2),
            vec![("ana".to_string(), 50), ("bo".to_string(), 0)]
        );
    }

    #[test]
    fn apply_all_keeps_going_after_errors() {
        let mut ledger = Ledger::default();
        ledger.open("ana");
        ledger.open("bo");
        let txs = vec![
            deposit("ana", 100),
            withdrawal("bo", 10),      // bo is empty: error
            transfer("ana", "bo", 30), // fine
            deposit("ghost", 5),       // no such account: error
        ];
        assert_eq!(
            ledger.apply_all(&txs),
            vec![insufficient("bo", 10, 0), unknown("ghost")]
        );
        assert_eq!(
            ledger.top_accounts(2),
            vec![("ana".to_string(), 70), ("bo".to_string(), 30)]
        );
    }

    #[test]
    fn top_accounts_sorts_by_balance_then_name() {
        let mut ledger = Ledger::default();
        for name in ["cy", "ana", "bo", "dee"] {
            ledger.open(name);
        }
        ledger.apply(&deposit("cy", 300)).unwrap();
        ledger.apply(&deposit("ana", 300)).unwrap();
        ledger.apply(&deposit("bo", 50)).unwrap();
        assert_eq!(
            ledger.top_accounts(3),
            vec![
                ("ana".to_string(), 300),
                ("cy".to_string(), 300),
                ("bo".to_string(), 50)
            ]
        );
        assert_eq!(ledger.top_accounts(10).len(), 4);
    }

    #[test]
    fn error_messages_read_well() {
        assert_eq!(unknown("ghost").to_string(), "unknown account: ghost");
        assert_eq!(
            insufficient("ana", 150, 100).to_string(),
            "insufficient funds in ana: needed 150, available 100"
        );
    }
}
