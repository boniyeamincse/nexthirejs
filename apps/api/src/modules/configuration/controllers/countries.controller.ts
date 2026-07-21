import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountriesService } from '../services/countries.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Configuration')
@Controller({
  path: 'config/countries',
  version: '1',
})
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List active supported countries' })
  @ApiResponse({ status: 200, description: 'Active countries listed successfully' })
  async listActiveCountries() {
    return this.countriesService.listActiveCountries();
  }
}
