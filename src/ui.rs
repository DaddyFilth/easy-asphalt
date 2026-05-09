// in src/ui.rs
use eframe::egui;
use std::sync::mpsc;

enum JobStatus {
    Idle,
    Running,
    Done(String),
    Error(String),
}

pub struct EasyAsphaltApp {
    input_path: String,
    output_path: String,
    status: JobStatus,
    rx: Option<mpsc::Receiver<JobStatus>>,
}

impl EasyAsphaltApp {
    pub fn new(_cc: &eframe::CreationContext) -> Self {
        Self {
            input_path: String::new(),
            output_path: String::new(),
            status: JobStatus::Idle,
            rx: None,
        }
    }

    fn start_job(&mut self) {
        let (tx, rx) = mpsc::channel();
        let input = self.input_path.clone();
        let output = self.output_path.clone();

        self.status = JobStatus::Running;
        self.rx = Some(rx);

        std::thread::spawn(move || {
            // Call into your core
            let cfg = crate::core::Config { input_path: input, output_path: output.clone() };
            let res = crate::core::run(cfg);

            let _ = match res {
                Ok(_) => tx.send(JobStatus::Done(format!("Wrote to {output}"))),
                Err(e) => tx.send(JobStatus::Error(e.to_string())),
            };
        });
    }

    fn poll_job(&mut self, ctx: &egui::Context) {
        if let Some(rx) = &self.rx {
            if let Ok(msg) = rx.try_recv() {
                self.status = msg;
                self.rx = None;
                ctx.request_repaint(); // ensure UI updates
            }
        }
    }
}

impl eframe::App for EasyAsphaltApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.poll_job(ctx);

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Easy‑Asphalt");

            ui.label("Input path:");
            ui.text_edit_singleline(&mut self.input_path);

            ui.label("Output path:");
            ui.text_edit_singleline(&mut self.output_path);

            let job_running = matches!(self.status, JobStatus::Running);

            if ui.add_enabled(!job_running, egui::Button::new("Run")).clicked() {
                self.start_job();
            }

            ui.separator();
            match &self.status {
                JobStatus::Idle => ui.label("Idle."),
                JobStatus::Running => ui.label("Working…"),
                JobStatus::Done(msg) => ui.colored_label(egui::Color32::GREEN, msg),
                JobStatus::Error(msg) => ui.colored_label(egui::Color32::RED, msg),
            }
        });
    }
}
