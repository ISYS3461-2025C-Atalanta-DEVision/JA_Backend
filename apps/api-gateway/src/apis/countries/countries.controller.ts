import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "@auth/decorators";
import { COUNTRIES } from "@common/constants/countries";

@Controller("countries")
@ApiTags("Countries")
export class CountriesController {
  @Get()
  @Public()
  @ApiOperation({ summary: "Get all countries (ISO 3166-1)" })
  @ApiResponse({
    status: 200,
    description: "Returns list of 249 ISO 3166-1 countries",
  })
  getCountries() {
    return COUNTRIES;
  }
}
