import { IsString, IsOptional } from 'class-validator';

export class CreateHierarchyDto {
  @IsString()
  hierarchyId: string;

  @IsString()
  hierarchyName: string;

  @IsString()
  standardClassifyId: string;

  @IsString()
  standardClassifyName: string;

  @IsString()
  themeClassifyId: string;

  @IsString()
  themeClassifyName: string;
}