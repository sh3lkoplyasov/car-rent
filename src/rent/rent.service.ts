import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { CreateRentDto } from './dto/create-rent.dto';
import { DISCOUNT, DEFAULT_PRICE } from './constant/price';
import { DatabaseService } from '../database/database.service';
import GenerateReportDro from './dto/generate-report.dro';

@Injectable()
export class RentService {
  constructor(private database: DatabaseService) {}

  calculateRentLength(start: string, end: string): number {
    const dif = dayjs(start).diff(end, 'day', true);

    return -Math.ceil(dif);
  }

  calculateTotal(days: number) {
    return DISCOUNT.reduce((amount, discount) => {
      if (discount.from <= days) {
        const count = Math.min(days, discount.until) - discount.from + 1;
        const price = (DEFAULT_PRICE * (100 - discount.percent)) / 100;

        return amount + price * count;
      }

      return amount;
    }, 0);
  }

  async getAvailableCars({ start, end }) {
    if (this.checkHoliday(start, end)) {
      throw new HttpException('Invalid rent period.', HttpStatus.BAD_REQUEST);
    }

    return await this.database.executeQuery(
      `SELECT * FROM "Cars" WHERE CAR_ID NOT IN (SELECT car_id FROM "Rent" WHERE '${start} ' < end_date AND '${end}' > start_date)`,
    );
  }

  checkHoliday(...dates) {
    return dates.some((date) => {
      const day = dayjs(date).day();
      return day === 0 || day === 6;
    });
  }

  async createRentSession(rent: CreateRentDto) {
    const length = this.calculateRentLength(rent.start, rent.end);
    if (length < 1 || this.checkHoliday(rent.start, rent.end)) {
      throw new HttpException('Invalid rent period.', HttpStatus.BAD_REQUEST);
    }
    if (length > 30) {
      throw new HttpException(
        'Rent session can not be longer than 30 days',
        HttpStatus.BAD_REQUEST,
      );
    }
    const availableDate = dayjs(rent.start)
      .subtract(3, 'day')
      .format('YYYY-MM-DD');

    const [car] = await this.database.executeQuery(
      `SELECT * FROM "Cars" WHERE registration_number='${rent.registration_number}' AND CAR_ID NOT IN(SELECT car_id FROM "Rent" WHERE '${availableDate} ' < end_date AND '${rent.end}' > start_date)`,
    );

    if (!car) {
      throw new HttpException(
        'No found cars for selected period.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.database.executeQuery(
      `INSERT INTO "Rent" (car_id, start_date, end_date)
      VALUES (${car.car_id}, '${rent.start}', '${rent.end}')`,
    );

    return {
      car,
      price: this.calculateTotal(length),
    };
  }

  async generateReport({ month, year }: GenerateReportDro) {
    let report = {};
    const date = dayjs().month(month).year(year);
    const startDate = date.startOf('month').format('YYYY-MM-DD');
    const endDate = date.endOf('month').format('YYYY-MM-DD');
    const daysInMonth = date.daysInMonth();

    const rentList = await this.database.executeQuery(
      `SELECT * FROM "Rent" JOIN "Cars" ON "Cars"."car_id" = "Rent"."car_id" WHERE '${startDate}' < end_date AND '${endDate}' > start_date`,
    );
    const unusedCars = await this.database.executeQuery(
      rentList.length > 0
        ? `SELECT * FROM "Cars" WHERE car_id NOT IN (${rentList
            .map((rent) => rent.car_id)
            .join(', ')})`
        : `SELECT * FROM "Cars"`,
    );

    for (const car of unusedCars) {
      report[car.registration_number] = {
        used: '0%',
      };
    }

    const rentDays = rentList.reduce((acc, session) => {
      let { start_date, end_date, registration_number } = session;

      if (dayjs(start_date).format('MMMM') !== dayjs(month).format('MMMM')) {
        start_date = startDate;
      }

      if (dayjs(end_date).format('MMMM') !== dayjs(month).format('MMMM')) {
        end_date = endDate;
      }
      const days = this.calculateRentLength(start_date, end_date);

      if (!acc[registration_number]) {
        acc[registration_number] = 0;
      }

      acc[registration_number] += days;

      return acc;
    }, {});

    for (const [number, days] of Object.entries(rentDays)) {
      const used = (Number(days) / daysInMonth) * 100;
      report[number] = { used: `${used.toFixed(2)}%` };
    }

    const carsReport: { used: string }[] = Object.values(report);

    const total = carsReport.reduce((acc, curr) => {
      return acc + parseFloat(curr.used);
    }, 0);

    return { report, total: `${(total / carsReport.length).toFixed(2)}%` };
  }
}
