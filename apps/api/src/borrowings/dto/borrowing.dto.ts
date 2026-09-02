import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BorrowingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBorrowingDto {
  @ApiProperty({ example: 'member-uuid' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiPropertyOptional({ example: '2026-09-16T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class QueryBorrowingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiPropertyOptional({ enum: BorrowingStatus })
  @IsOptional()
  @IsEnum(BorrowingStatus)
  status?: BorrowingStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
