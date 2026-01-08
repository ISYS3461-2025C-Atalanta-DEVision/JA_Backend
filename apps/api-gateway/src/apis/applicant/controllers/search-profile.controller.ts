import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpStatus,
  HttpException,
  Inject,
  Logger,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { CurrentUser } from "@auth/decorators";
import { AuthenticatedUser } from "@auth/interfaces";
import { EmailVerifiedGuard } from "@auth/guards";
import { UpsertSearchProfileDto } from "../dtos/requests/upsert-search-profile.dto";
import { firstValueFrom, timeout, catchError } from "rxjs";

@ApiTags("Search Profiles")
@Controller("search-profiles")
@UseGuards(EmailVerifiedGuard)
export class SearchProfileController {
  private readonly logger = new Logger(SearchProfileController.name);

  constructor(
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) {}

  @Get("me")
  @ApiOperation({
    summary: "Get my search profile",
    description: "Get the current user's search profile (requires JWT auth)",
  })
  @ApiResponse({
    status: 200,
    description: "Search profile retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Search profile not found" })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.email} fetching their search profile`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "searchProfile.get" }, { applicantId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Search profile not found",
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to fetch search profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({
    summary: "Create or update search profile",
    description:
      "Create or update the current user's search profile (requires JWT auth)",
  })
  @ApiBody({ type: UpsertSearchProfileDto })
  @ApiResponse({
    status: 200,
    description: "Search profile saved successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async upsertProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertSearchProfileDto,
  ) {
    this.logger.log(`User ${user.email} upserting search profile`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: "searchProfile.upsert" },
            { applicantId: user.id, profile: dto },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to save search profile",
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to save search profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  @ApiOperation({
    summary: "Deactivate search profile",
    description:
      "Deactivate the current user's search profile (requires JWT auth)",
  })
  @ApiResponse({
    status: 200,
    description: "Search profile deactivated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Search profile not found" })
  async deactivateProfile(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.email} deactivating search profile`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "searchProfile.deactivate" }, { applicantId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Search profile not found",
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return { success: result, message: "Search profile deactivated" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to deactivate search profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("activate")
  @ApiOperation({
    summary: "Activate search profile",
    description:
      "Activate the current user's search profile (requires JWT auth)",
  })
  @ApiResponse({
    status: 200,
    description: "Search profile activated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Search profile not found" })
  async activateProfile(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.email} activating search profile`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "searchProfile.activate" }, { applicantId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Search profile not found",
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return { success: result, message: "Search profile activated" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to activate search profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
