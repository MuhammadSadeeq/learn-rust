//! The calculator tool. The model sends two numbers and an operation name.
//!
//! It does not parse text such as "6 * 7". An expression parser is a good
//! exercise, and it is left out on purpose. Every line of parsing is a line
//! that can go wrong, and the calculator is here to show the tool shape.
//!
//! Laravel counterpart: a small action class with one `handle()` method.

use serde::Deserialize;
use serde_json::{Value, json};

use super::{Tool, ToolError, ToolFuture};

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Op {
    Add,
    Sub,
    Mul,
    Div,
}

#[derive(Debug, Deserialize)]
struct Input {
    a: f64,
    b: f64,
    op: Op,
}

pub struct Calculator;

impl Calculator {
    /// The work, without the async wrapper. Easy to test.
    pub fn compute(input: Value) -> Result<String, ToolError> {
        let input: Input =
            serde_json::from_value(input).map_err(|e| ToolError::BadInput(e.to_string()))?;
        let result = match input.op {
            Op::Add => input.a + input.b,
            Op::Sub => input.a - input.b,
            Op::Mul => input.a * input.b,
            Op::Div => {
                if input.b == 0.0 {
                    return Err(ToolError::BadInput("cannot divide by zero".into()));
                }
                input.a / input.b
            }
        };
        // `f64` prints 42.0 as "42", so whole results look like whole numbers.
        Ok(result.to_string())
    }
}

impl Tool for Calculator {
    fn name(&self) -> &str {
        "calculator"
    }

    fn description(&self) -> &str {
        "Adds, subtracts, multiplies or divides two numbers."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "a": {"type": "number"},
                "b": {"type": "number"},
                "op": {"type": "string", "enum": ["add", "sub", "mul", "div"]}
            },
            "required": ["a", "b", "op"]
        })
    }

    fn call<'a>(&'a self, input: Value) -> ToolFuture<'a> {
        // There is no await here. The work is instant, so the future is ready
        // on its first poll.
        Box::pin(async move { Self::compute(input) })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn multiplies_two_numbers() {
        let result = Calculator::compute(json!({"a": 6, "b": 7, "op": "mul"}));
        assert_eq!(result.unwrap(), "42");
    }

    #[test]
    fn shows_fractions() {
        let result = Calculator::compute(json!({"a": 5, "b": 2, "op": "div"}));
        assert_eq!(result.unwrap(), "2.5");
    }

    #[test]
    fn refuses_to_divide_by_zero() {
        let result = Calculator::compute(json!({"a": 1, "b": 0, "op": "div"}));
        assert!(matches!(result, Err(ToolError::BadInput(_))));
    }

    #[test]
    fn an_unknown_operation_is_bad_input() {
        let result = Calculator::compute(json!({"a": 2, "b": 3, "op": "power"}));
        assert!(matches!(result, Err(ToolError::BadInput(_))));
    }
}
