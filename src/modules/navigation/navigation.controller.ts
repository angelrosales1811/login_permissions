import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateNavigationDto } from './dto/create-navigation.dto';
import { UpdateNavigationDto } from './dto/update-navigation.dto';
import { NavigationService } from './navigation.service';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Post()
  create(@Body() createNavigationDto: CreateNavigationDto) {
    return this.navigationService.create(createNavigationDto);
  }

  @Get()
  findAll() {
    return this.navigationService.findAll();
  }

  @Get('my-menu')
  @UseGuards(JwtAuthGuard)
  async getMyMenu(@CurrentUser() user: AuthUser) {
    return this.navigationService.getMenusByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.navigationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNavigationDto: UpdateNavigationDto) {
    return this.navigationService.update(+id, updateNavigationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.navigationService.remove(+id);
  }
}
