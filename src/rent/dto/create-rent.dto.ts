import { ApiProperty } from '@nestjs/swagger';

export class CreateRentDto {
  @ApiProperty({
    example: 'FFF5GH',
    description: 'Car number',
  })
  registration_number: string;
  @ApiProperty({
    example: '2011-11-11',
  })
  start: string;

  @ApiProperty({
    example: '2011-11-12',
  })
  end: string;
}
