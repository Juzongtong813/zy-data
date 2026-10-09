import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('maintenance_vehicles')
@Index('uk_maintenance_vehicle_plate_org', ['plateNumber', 'orgCompany', 'orgRegion'], { unique: true })
@Index('idx_maintenance_vehicle_org_status', ['orgProvince', 'orgCompany', 'orgRegion', 'status', 'deletedAt'])
export class MaintenanceVehicleEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 }) id: string;
  @Column({ name: 'vehicle_code', type: 'varchar', length: 100, nullable: true }) vehicleCode: string | null;
  @Column({ name: 'plate_number', type: 'varchar', length: 64 }) plateNumber: string;
  @Column({ name: 'vehicle_type', type: 'varchar', length: 100, nullable: true }) vehicleType: string | null;
  @Column({ name: 'usage', type: 'varchar', length: 160, nullable: true }) usage: string | null;
  @Column({ name: 'driver_mobile', type: 'varchar', length: 32, nullable: true }) driverMobile: string | null;
  @Column({ name: 'brand_model', type: 'varchar', length: 255, nullable: true }) brandModel: string | null;
  @Column({ name: 'fuel_type', type: 'varchar', length: 64, nullable: true }) fuelType: string | null;
  @Column({ name: 'ownership', type: 'varchar', length: 64, nullable: true }) ownership: string | null;
  @Column({ name: 'org_province', type: 'varchar', length: 160 }) orgProvince: string;
  @Column({ name: 'org_company', type: 'varchar', length: 200 }) orgCompany: string;
  @Column({ name: 'org_region', type: 'varchar', length: 160 }) orgRegion: string;
  @Column({ type: 'varchar', length: 16, default: 'active' }) status: 'active' | 'inactive';
  @Column({ name: 'deleted_at', type: 'datetime', nullable: true }) deletedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' }) updatedAt: Date;
}
