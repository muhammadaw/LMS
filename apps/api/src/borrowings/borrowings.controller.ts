import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BorrowingsService } from './borrowings.service';
import { CreateBorrowingDto, QueryBorrowingsDto } from './dto/borrowing.dto';

@ApiTags('Borrowings')
@Controller('borrowings')
export class BorrowingsController {
  constructor(private readonly borrowingsService: BorrowingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all borrowing records with filters and pagination' })
  findAll(@Query() query: QueryBorrowingsDto) {
    return this.borrowingsService.findAll(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary metrics and recent activity' })
  getDashboardMetrics() {
    return this.borrowingsService.getDashboardMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get borrowing details by ID' })
  findOne(@Param('id') id: string) {
    return this.borrowingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Borrow a book with strict rule validation' })
  borrowBook(@Body() dto: CreateBorrowingDto) {
    return this.borrowingsService.borrowBook(dto);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Return a borrowed book with late day and fine calculation' })
  returnBook(@Param('id') id: string) {
    return this.borrowingsService.returnBook(id);
  }
}
