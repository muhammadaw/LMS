import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Critical Library Circulation Flow (E2E Integration)', () => {
  let app: INestApplication;
  let testMemberId: string;
  let testBookId: string;
  let testBorrowingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Create member -> 201 Created', async () => {
    const rand = Math.floor(Math.random() * 100000);
    const res = await request(app.getHttpServer())
      .post('/api/v1/members')
      .send({
        name: `E2E Tester ${rand}`,
        email: `tester_${rand}@example.com`,
        phone: '+6281999999',
      });

    if (res.status !== 201) {
      console.error('Error 500 details:', res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testMemberId = res.body.data.id;
  });

  it('2. Create book with 1 copy -> 201 Created', async () => {
    const rand = Math.floor(Math.random() * 100000);
    const res = await request(app.getHttpServer())
      .post('/api/v1/books')
      .send({
        title: `E2E Architecture Guide ${rand}`,
        author: 'E2E Author',
        isbn: `978-013${rand}`,
        publisher: 'Test Press',
        publishedYear: 2024,
        category: 'Technology',
        totalCopies: 1,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.availableCopies).toBe(1);
    testBookId = res.body.data.id;
  });

  it('3. Borrow book -> decreases stock from 1 to 0', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/borrowings')
      .send({
        memberId: testMemberId,
        bookId: testBookId,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('BORROWED');
    testBorrowingId = res.body.data.id;

    // Check stock drops to 0
    const bookRes = await request(app.getHttpServer())
      .get(`/api/v1/books/${testBookId}`)
      .expect(200);

    expect(bookRes.body.data.availableCopies).toBe(0);
  });

  it('4. Attempt second borrow for same out-of-stock book -> 409 BOOK_OUT_OF_STOCK', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/borrowings')
      .send({
        memberId: testMemberId,
        bookId: testBookId,
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BOOK_OUT_OF_STOCK');
  });

  it('5. Return book -> marks RETURNED & restores stock from 0 to 1', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/borrowings/${testBorrowingId}/return`)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.borrowing.status).toBe('RETURNED');

    // Verify stock is restored
    const bookRes = await request(app.getHttpServer())
      .get(`/api/v1/books/${testBookId}`)
      .expect(200);

    expect(bookRes.body.data.availableCopies).toBe(1);
  });

  it('6. Attempt second return -> 409 ALREADY_RETURNED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/borrowings/${testBorrowingId}/return`)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ALREADY_RETURNED');
  });
});
