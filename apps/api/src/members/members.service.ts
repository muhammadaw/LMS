import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMemberDto,
  UpdateMemberDto,
  QueryMembersDto,
} from './dto/member.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '@lms/types';
import { Prisma, MemberStatus } from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMembersDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { memberNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, members] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              borrowings: {
                where: { status: { in: ['BORROWED', 'OVERDUE'] } },
              },
            },
          },
        },
      }),
    ]);

    const formattedMembers = members.map((m) => ({
      id: m.id,
      name: m.name,
      memberNumber: m.memberNumber,
      email: m.email,
      phone: m.phone,
      status: m.status,
      activeBorrowingsCount: m._count.borrowings,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return {
      data: formattedMembers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        borrowings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { book: true },
        },
        _count: {
          select: {
            borrowings: {
              where: { status: { in: ['BORROWED', 'OVERDUE'] } },
            },
          },
        },
      },
    });

    if (!member) {
      throw new BusinessException(
        ErrorCode.MEMBER_NOT_FOUND,
        `Member with ID ${id} was not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    return {
      ...member,
      activeBorrowingsCount: member._count.borrowings,
    };
  }

  async create(dto: CreateMemberDto) {
    let memberNumber = dto.memberNumber;
    if (!memberNumber) {
      const count = await this.prisma.member.count();
      memberNumber = `MEM-${String(count + 1).padStart(3, '0')}`;
    }

    // Check duplicate memberNumber
    const existingNumber = await this.prisma.member.findUnique({
      where: { memberNumber },
    });
    if (existingNumber) {
      throw new BusinessException(
        ErrorCode.DUPLICATE_MEMBER_NUMBER,
        `Member with number ${memberNumber} already exists.`,
        HttpStatus.CONFLICT
      );
    }

    // Check duplicate email
    const existingEmail = await this.prisma.member.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BusinessException(
        ErrorCode.DUPLICATE_EMAIL,
        `Member with email ${dto.email} already exists.`,
        HttpStatus.CONFLICT
      );
    }

    return this.prisma.member.create({
      data: {
        name: dto.name,
        memberNumber,
        email: dto.email,
        phone: dto.phone,
        status: dto.status || MemberStatus.ACTIVE,
      },
    });
  }

  async update(id: string, dto: UpdateMemberDto) {
    const member = await this.findOne(id);

    if (dto.memberNumber && dto.memberNumber !== member.memberNumber) {
      const existing = await this.prisma.member.findUnique({
        where: { memberNumber: dto.memberNumber },
      });
      if (existing) {
        throw new BusinessException(
          ErrorCode.DUPLICATE_MEMBER_NUMBER,
          `Member with number ${dto.memberNumber} already exists.`,
          HttpStatus.CONFLICT
        );
      }
    }

    if (dto.email && dto.email !== member.email) {
      const existing = await this.prisma.member.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new BusinessException(
          ErrorCode.DUPLICATE_EMAIL,
          `Member with email ${dto.email} already exists.`,
          HttpStatus.CONFLICT
        );
      }
    }

    return this.prisma.member.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeBorrowings = await this.prisma.borrowing.findFirst({
      where: {
        memberId: id,
        status: { in: ['BORROWED', 'OVERDUE'] },
      },
    });

    if (activeBorrowings) {
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        'Cannot delete member with active or overdue borrowings.',
        HttpStatus.CONFLICT
      );
    }

    return this.prisma.member.delete({ where: { id } });
  }
}
