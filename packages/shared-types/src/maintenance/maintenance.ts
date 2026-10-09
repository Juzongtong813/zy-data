/**
 * 维护管理共享类型的第一版骨架。
 * 字段表确认后，再逐项扩展证件、保险和运行指标字段。
 */

export interface MaintenanceOrgFields {
  /** 省级组织名称或编码 */
  orgProvince: string;
  /** 公司/分公司名称或编码 */
  orgCompany: string;
  /** 地市/区域名称或编码 */
  orgRegion: string;
}

export type MaintenanceRecordStatus = 'active' | 'inactive' | 'deleted';

export interface MaintenanceRecordBase extends MaintenanceOrgFields {
  id: string;
  status: MaintenanceRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenancePersonnel extends MaintenanceRecordBase {
  personnelCode: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  account?: string | null;
  position?: string | null;
  employmentType?: string | null;
  mobile?: string | null;
}

export interface MaintenanceVehicle extends MaintenanceRecordBase {
  vehicleCode?: string | null;
  plateNumber: string;
  vehicleType?: string | null;
  usage?: string | null;
  driverMobile?: string | null;
  brandModel?: string | null;
  fuelType?: string | null;
  ownership?: string | null;
}

export interface MaintenanceGenerator extends MaintenanceRecordBase {
  generatorCode: string;
  contactName?: string | null;
  contactMobile?: string | null;
  model?: string | null;
  ratedPowerKw?: number | null;
  standardFuelConsumption?: number | null;
  generatorType?: string | null;
  fuelType?: string | null;
  ownership?: string | null;
  usageStatus?: string | null;
  externalId?: string | null;
}
