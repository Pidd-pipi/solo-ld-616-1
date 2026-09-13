import type { CertificateResult } from "../constants/CertificateResult";

export interface CalibrationCertificate { id: number; device_id: number; plan_id: number | null; certificate_no: string; result_status: CertificateResult; valid_until: string; file_path: string; issued_by: string }
