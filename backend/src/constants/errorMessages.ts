export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "missing bearer token",
  RBAC_DENIED: "role denied",
  VALIDATION_FAILED: "invalid payload",
  RATE_LIMITED: "too many requests",
  DEVICE_NOT_FOUND: "计量设备不存在",
  PLAN_NOT_FOUND: "校准计划不存在",
  VENDOR_NOT_FOUND: "校准机构不存在",
  ALERT_NOT_FOUND: "超期预警不存在",
  DUPLICATE_ASSIGNMENT: "校准计划已指派机构，禁止重复指派",
  DUPLICATE_CERTIFICATE_NO: "证书编号已存在，禁止重复登记",
  CERT_EXPIRED: "证书有效期早于当前时间，禁止登记过期证书",
  CERT_DEVICE_MISMATCH: "证书设备与计划设备不一致，禁止跨设备登记",
  INVALID_PLAN_TRANSITION: "校准计划当前状态不允许该操作",
  INVALID_ALERT_TRANSITION: "超期预警当前状态不允许该操作"
};
