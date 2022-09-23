import { ApiProperty } from '@nestjs/swagger';

export default class RentAvailableDto {
  @ApiProperty({
    example: '2011-11-11',
  })
  start: string;

  @ApiProperty({
    example: '2011-11-12',
  })
  end: string;
}
