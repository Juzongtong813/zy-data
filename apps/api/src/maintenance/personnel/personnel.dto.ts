import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class CreatePersonnelDto {
  @IsString() @IsNotEmpty() @MaxLength(100) personnelCode!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) orgProvince!: string;
  @IsString() @IsNotEmpty() @MaxLength(200) orgCompany!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) orgRegion!: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsInt() @Min(0) @Max(150) age?: number;
  @IsOptional() @IsString() account?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() employmentType?: string;
  @IsOptional() @IsString() mobile?: string;
}
export class UpdatePersonnelDto extends CreatePersonnelDto {}
