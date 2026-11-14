import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { Permissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('IAM', 'USERS', '755')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('IAM', 'USERS', '444')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/roles')
  @Permissions('IAM', 'USERS', '444')
  getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @Put(':id/roles')
  @Permissions('IAM', 'USERS', '644')
  updateUserRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.usersService.updateUserRoles(id, dto);
  }
}
