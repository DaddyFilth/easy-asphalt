// src/lib.rs
pub mod core {
    pub struct Config {
        pub input_path: String,
        pub output_path: String,
    }

    pub fn run(config: Config) -> Result<(), Box<dyn std::error::Error>> {
        // your existing processing
        Ok(())
    }
}
