// ============================================================================
//  QUEST boss3_ledger · Bank ledger            Chapter 13 · Iterators & Closures
// ----------------------------------------------------------------------------
//  BOSS, Act III. Build the core of a bank ledger. The Laravel version of this
//  idea is DB::transaction(): money moves completely or not at all.
//
//  The rules. The tests check each one.
//    open(name)        creates an account at 0. Opening it again changes nothing.
//    apply(tx)         runs one transaction, all or nothing. Deposit and
//                      Withdrawal need an existing account. Transfer checks
//                      `from`, then `to`, then the funds. A failure returns its
//                      error and changes no balance.
//    apply_all(txs)    applies each transaction in order. After an error it keeps
//                      going, and it returns the errors in order.
//    top_accounts(n)   the n largest balances, biggest first. Ties sort by name.
//    total()           the sum of all balances.
//    Display           "unknown account: NAME" and
//                      "insufficient funds in NAME: needed N, available M"
//
//  Helper methods are up to you. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
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
        todo!()
    }
}

impl std::error::Error for LedgerError {}

#[derive(Debug, Default)]
struct Ledger {
    balances: HashMap<String, u64>,
}

impl Ledger {
    fn open(&mut self, name: &str) {
        todo!()
    }

    fn apply(&mut self, tx: &Transaction) -> Result<(), LedgerError> {
        todo!()
    }

    fn apply_all(&mut self, txs: &[Transaction]) -> Vec<LedgerError> {
        todo!()
    }

    fn top_accounts(&self, n: usize) -> Vec<(String, u64)> {
        todo!()
    }

    fn total(&self) -> u64 {
        todo!()
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
