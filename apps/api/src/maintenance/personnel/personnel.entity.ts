import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('maintenance_personnel')
@Index('uk_maintenance_personnel_code_org', ['personnelCode', 'orgCompany', 'orgRegion'], { unique: true })
@Index('idx_maintenance_personnel_org_status', ['orgProvince', 'orgCompany', 'orgRegion', 'status', 'deletedAt'])
export class MaintenancePersonnelEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'personnel_code', type: 'varchar', length: 100 })
  personnelCode: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  gender: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  account: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  position: string | null;

  @Column({ name: 'employment_type', type: 'varchar', length: 64, nullable: true })
  employmentType: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  mobile: string | null;

  @Column({ name: 'org_province', type: 'varchar', length: 160 })
  orgProvince: string;

  @Column({ name: 'org_company', type: 'varchar', length: 200 })
  orgCompany: string;

  @Column({ name: 'org_region', type: 'varchar', length: 160 })
  orgRegion: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: 'active' | 'inactive';

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
