import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RentService } from './rent.service';
import { CreateRentDto } from './dto/create-rent.dto';
import GenerateReportDro from './dto/generate-report.dro';
import RentAvailableDto from './dto/available-rent.dto';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post()
  create(@Body() createRentDto: CreateRentDto) {
    return this.rentService.createRentSession(createRentDto);
  }

  @Get('available')
  availableCars(@Query() rent: RentAvailableDto) {
    return this.rentService.getAvailableCars(rent);
  }

  @Get('price')
  calculatePrice(@Query('length') length: number) {
    return this.rentService.calculateTotal(length);
  }

  @Get('report')
  generateReport(@Query() report: GenerateReportDro) {
    return this.rentService.generateReport(report);
  }
}
