import { PrismaClient, MemberStatus, BorrowingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LMS database...');

  // Clean tables in correct order
  await prisma.borrowing.deleteMany();
  await prisma.book.deleteMany();
  await prisma.member.deleteMany();

  console.log('Cleared existing data.');

  // 1. Seed Books (18 books across various categories)
  const booksData = [
    {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      publisher: 'Prentice Hall',
      publishedYear: 2008,
      category: 'Technology',
      totalCopies: 5,
      availableCopies: 4, // 1 borrowed in seed
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1449373320',
      publisher: "O'Reilly Media",
      publishedYear: 2017,
      category: 'Technology',
      totalCopies: 4,
      availableCopies: 3, // 1 borrowed in seed
    },
    {
      title: 'Refactoring: Improving the Design of Existing Code',
      author: 'Martin Fowler',
      isbn: '978-0134757599',
      publisher: 'Addison-Wesley',
      publishedYear: 2018,
      category: 'Technology',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'The Pragmatic Programmer: Your Journey to Mastery',
      author: 'David Thomas, Andrew Hunt',
      isbn: '978-0135957059',
      publisher: 'Addison-Wesley',
      publishedYear: 2019,
      category: 'Technology',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
      author: 'Eric Evans',
      isbn: '978-0321125217',
      publisher: 'Addison-Wesley',
      publishedYear: 2003,
      category: 'Technology',
      totalCopies: 2,
      availableCopies: 0, // Out of stock for testing!
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0060935467',
      publisher: 'Harper Perennial',
      publishedYear: 1960,
      category: 'Literature',
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0451524935',
      publisher: 'Signet Classic',
      publishedYear: 1949,
      category: 'Literature',
      totalCopies: 6,
      availableCopies: 5, // 1 borrowed
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0743273565',
      publisher: 'Scribner',
      publishedYear: 1925,
      category: 'Literature',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0141439518',
      publisher: 'Penguin Classics',
      publishedYear: 1813,
      category: 'Literature',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '978-0553380163',
      publisher: 'Bantam Books',
      publishedYear: 1988,
      category: 'Science',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'Cosmos',
      author: 'Carl Sagan',
      isbn: '978-0345539434',
      publisher: 'Ballantine Books',
      publishedYear: 1980,
      category: 'Science',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      isbn: '978-0062316097',
      publisher: 'Harper',
      publishedYear: 2014,
      category: 'History',
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: 'Guns, Germs, and Steel: The Fates of Human Societies',
      author: 'Jared Diamond',
      isbn: '978-0393354324',
      publisher: 'W. W. Norton & Company',
      publishedYear: 1997,
      category: 'History',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '978-0735211292',
      publisher: 'Avery',
      publishedYear: 2018,
      category: 'Self-Help',
      totalCopies: 6,
      availableCopies: 6,
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      isbn: '978-0374533557',
      publisher: 'Farrar, Straus and Giroux',
      publishedYear: 2011,
      category: 'Psychology',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '978-0441172719',
      publisher: 'Ace Books',
      publishedYear: 1965,
      category: 'Sci-Fi',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: 'Foundation',
      author: 'Isaac Asimov',
      isbn: '978-0553293357',
      publisher: 'Spectra',
      publishedYear: 1951,
      category: 'Sci-Fi',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0547928227',
      publisher: 'Houghton Mifflin Harcourt',
      publishedYear: 1937,
      category: 'Fantasy',
      totalCopies: 5,
      availableCopies: 5,
    },
  ];

  const createdBooks = [];
  for (const b of booksData) {
    const book = await prisma.book.create({ data: b });
    createdBooks.push(book);
  }
  console.log(`Seeded ${createdBooks.length} books.`);

  // 2. Seed Members (8 members: active, inactive, testing edge-cases)
  const membersData = [
    {
      name: 'Alice Johnson',
      memberNumber: 'MEM-001',
      email: 'alice.johnson@example.com',
      phone: '+6281234567890',
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'Bob Smith',
      memberNumber: 'MEM-002',
      email: 'bob.smith@example.com',
      phone: '+6281234567891',
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'Charlie Brown',
      memberNumber: 'MEM-003',
      email: 'charlie.brown@example.com',
      phone: '+6281234567892',
      status: MemberStatus.INACTIVE, // Inactive member for testing reject
    },
    {
      name: 'Diana Prince',
      memberNumber: 'MEM-004',
      email: 'diana.prince@example.com',
      phone: '+6281234567893',
      status: MemberStatus.ACTIVE, // Will hold an overdue loan for testing reject
    },
    {
      name: 'Evan Wright',
      memberNumber: 'MEM-005',
      email: 'evan.wright@example.com',
      phone: '+6281234567894',
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'Fiona Gallagher',
      memberNumber: 'MEM-006',
      email: 'fiona.g@example.com',
      phone: '+6281234567895',
      status: MemberStatus.ACTIVE,
    },
    {
      name: 'George Clark',
      memberNumber: 'MEM-007',
      email: 'george.c@example.com',
      phone: '+6281234567896',
      status: MemberStatus.INACTIVE,
    },
    {
      name: 'Hannah Abbott',
      memberNumber: 'MEM-008',
      email: 'hannah.a@example.com',
      phone: '+6281234567897',
      status: MemberStatus.ACTIVE,
    },
  ];

  const createdMembers = [];
  for (const m of membersData) {
    const member = await prisma.member.create({ data: m });
    createdMembers.push(member);
  }
  console.log(`Seeded ${createdMembers.length} members.`);

  // 3. Seed Borrowings (including active, overdue, returned)
  const now = new Date();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const past16Days = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
  const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // Alice has 1 active normal borrowing
  await prisma.borrowing.create({
    data: {
      memberId: createdMembers[0].id,
      bookId: createdBooks[0].id, // Clean Code
      borrowedAt: past2Days,
      dueAt: future10Days,
      status: BorrowingStatus.BORROWED,
      lateDays: 0,
      fineAmount: 0,
    },
  });

  // Bob has 1 completed returned borrowing
  await prisma.borrowing.create({
    data: {
      memberId: createdMembers[1].id,
      bookId: createdBooks[6].id, // 1984
      borrowedAt: past30Days,
      dueAt: past16Days,
      returnedAt: past16Days,
      status: BorrowingStatus.RETURNED,
      lateDays: 0,
      fineAmount: 0,
    },
  });

  // Diana has 1 overdue borrowing (borrowed 30 days ago, due 16 days ago, not returned)
  await prisma.borrowing.create({
    data: {
      memberId: createdMembers[3].id,
      bookId: createdBooks[1].id, // Designing Data-Intensive Applications
      borrowedAt: past30Days,
      dueAt: past16Days,
      status: BorrowingStatus.OVERDUE,
      lateDays: 16,
      fineAmount: 16 * 5000,
    },
  });

  console.log('Seeded initial borrowing transactions.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
