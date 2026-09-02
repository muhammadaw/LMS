import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BooksModule } from './books/books.module';
import { MembersModule } from './members/members.module';
import { BorrowingsModule } from './borrowings/borrowings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    BooksModule,
    MembersModule,
    BorrowingsModule,
  ],
})
export class AppModule {}
