import { ApiProperty } from '@nestjs/swagger';

export default class GenerateReportDro {
  @ApiProperty({
    example: 2022,
    description: 'Year of the report',
  })
  year: number;

  @ApiProperty({
    example: 1,
    description: 'Month of the report',
  })
  month: number;
}
