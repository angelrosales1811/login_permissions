import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application } from './entities/application.entity';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>
  ) {}

  async create(dto: CreateApplicationDto): Promise<Application> {
    const exists = await this.applicationRepository.findOne({
      where: {
        code: dto.code,
      },
    });

    if (exists) {
      throw new ConflictException('Ya existe una aplicación con ese código');
    }

    const application = this.applicationRepository.create({
      ...dto,
      active: true,
    });

    return this.applicationRepository.save(application);
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    return application;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    const application = await this.findOne(id);

    Object.assign(application, dto);

    return this.applicationRepository.save(application);
  }

  async updateStatus(id: string, active: boolean): Promise<Application> {
    const application = await this.findOne(id);

    application.active = active;

    return this.applicationRepository.save(application);
  }
}
