pub struct Config {
    pub input_path: String,
    pub output_path: String,
}

pub fn run(_config: Config) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}
