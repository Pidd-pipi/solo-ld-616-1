# 设备计量校准排期 API 服务

面向实验室和工厂的计量设备校准周期管理 API，覆盖设备台账、校准计划、证书、超期预警和外部机构管理。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

后端健康检查：<http://localhost:21116/health>

核心联动接口（同时挂载短路径 `/api/plans`、`/api/certificates`、`/api/alerts`）：

```bash
# 指派校准机构（重复指派返回 409 DUPLICATE_ASSIGNMENT）
curl -X POST http://localhost:21116/api/plans/1/assign -H 'Content-Type: application/json' -d '{"vendor_id":1}'

# 登记校准证书（跨设备返回 409 CERT_DEVICE_MISMATCH；结果同步设备状态并生成/关闭预警）
curl -X POST http://localhost:21116/api/certificates -H 'Content-Type: application/json' \
  -d '{"device_id":1,"plan_id":1,"certificate_no":"CERT-2026-0001","result_status":"PASS","valid_until":"2027-09-13"}'

# 查询超期预警（OPEN 状态）
curl http://localhost:21116/api/alerts/overdue

# 关闭预警（重复关闭返回 409 INVALID_ALERT_TRANSITION）
curl -X POST http://localhost:21116/api/alerts/1/close
```


## 本地开发方式


- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | - |
| 后端 | NestJS + TypeScript + TypeORM |
| 数据库 | PostgreSQL 15 |
| 部署 | Docker Compose |

## 项目目录结构

```text

backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `calibration-api`

- `BACKEND_PORT`: 后端端口，默认 `21116`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: calibration-api`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-calibration-api}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- DeviceCalibrationStatus: constants/DeviceCalibrationStatus、models/MeasuringDevice、constructors/MeasuringDeviceDtoFactory、logTemplates、errorMessages、services（指派置 CALIBRATING、证书结果置 VALID/OVERDUE）、控制器均有引用。
- PlanStatus: constants/PlanStatus、models/CalibrationPlan、constructors/CalibrationPlanDtoFactory、logTemplates、errorMessages、services（PLANNED→ASSIGNED→CERT_UPLOADED 流转校验）、控制器均有引用。
- CertificateResult: constants/CertificateResult、models/CalibrationCertificate、constructors/CalibrationCertificateDtoFactory、logTemplates、errorMessages、services（PASS/LIMITED_PASS 关闭预警，FAIL/NEED_REPAIR 生成预警）、控制器均有引用。
- AlertStatus: constants/AlertStatus、models/OverdueAlert、constructors/OverdueAlertDtoFactory、services（OPEN→CLOSED 流转校验）、控制器均有引用。

## 业务联动规则

- 计划指派：仅 `PLANNED` 可指派；`ASSIGNED`/`IN_PROGRESS` 再指派返回 `409 DUPLICATE_ASSIGNMENT`，其余状态返回 `409 INVALID_PLAN_TRANSITION`；指派成功后设备置 `CALIBRATING`。
- 证书登记：证书编号重复返回 `409 DUPLICATE_CERTIFICATE_NO`；`valid_until` 早于当前时间返回 `409 CERT_EXPIRED`；`valid_until` 不是真实存在的日历日期（纯日期与带时间部分的 ISO 格式均逐分量严格校验，如 `2027-02-30T00:00:00Z`）返回 `400 VALIDATION_FAILED`；证书 `device_id` 与计划 `device_id` 不一致返回 `409 CERT_DEVICE_MISMATCH`；仅 `ASSIGNED`/`IN_PROGRESS` 计划可登记证书，否则 `409 INVALID_PLAN_TRANSITION`；以上校验全部在状态变更前完成，被拒绝的请求不会改变设备、计划和预警状态；登记后计划置 `CERT_UPLOADED`，`PASS`/`LIMITED_PASS` 置设备 `VALID` 并关闭该设备全部 OPEN 预警，`FAIL`/`NEED_REPAIR` 置设备 `OVERDUE` 且该设备无 OPEN 预警时自动生成 HIGH 预警。
- 超期预警：`GET /api/alerts/overdue` 返回全部 OPEN 预警；`POST /api/alerts/:id/close` 仅允许关闭 OPEN 预警，重复关闭返回 `409 INVALID_ALERT_TRANSITION`。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
