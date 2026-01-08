import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Inject,
  Logger,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { Request } from "express";
import { CurrentUser, ApiKeyAuth, Public } from "@auth/decorators";
import { AuthenticatedUser } from "@auth/interfaces";
import { EmailVerifiedGuard } from "@auth/guards";
import { CreateApplicantDto } from "../dtos/requests/create-applicant.dto";
import { UpdateApplicantDto } from "../dtos/requests/update-applicant.dto";
import { firstValueFrom, timeout, catchError } from "rxjs";
import {
  parseFilters,
  parseSorting,
  validatePagination,
} from "../../../shared/utils";

@ApiTags("Applicants")
@Controller("applicants")
@UseGuards(EmailVerifiedGuard)
export class ApplicantController {
  private readonly logger = new Logger(ApplicantController.name);

  constructor(
    @Inject("APPLICANT_SERVICE") private readonly applicantClient: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({
    summary: "Create applicant",
    description: "Create a new applicant profile (requires JWE auth)",
  })
  @ApiBody({ type: CreateApplicantDto })
  @ApiResponse({ status: 201, description: "Applicant created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateApplicantDto,
  ) {
    this.logger.log(`User ${user.email} creating applicant`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.create" }, { ...createDto, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Applicant service unavailable",
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
        error.message || "Failed to create applicant",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("activate-email")
  @Public()
  @ApiOperation({
    summary: "Activate applicant email",
    description: "activate the registered applicant email",
  })
  @ApiResponse({ status: 200, description: "Applicant activated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Applicant not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async activateEmail(@Query('token') token: string) {
    try {
      console.log("starto");

      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.activateEmail" }, { token })
          .pipe(
            timeout(5000),
            catchError((error) => {
              console.log(error);

              throw new HttpException(
                error.message || "Failed to activate applicant email",
                error.status || HttpStatus.NOT_FOUND,
              );
            }),
          ),
      );
      return result;
    } catch (error) {

      this.logger.log(error)

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to activate applicant email",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("send-email/:id")
  @Public()
  @ApiOperation({
    summary: "Send verification email",
    description: "send the verification email",
  })
  @ApiResponse({ status: 200, description: "Verification email sent successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Applicant not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async sendEmail(@Param("id") id: string) {
    try {
      const result = await firstValueFrom(
        this.applicantClient.send({ cmd: "applicant.sendEmail" }, { id }).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              error.message || "Failed to send applicant email",
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
        error.message || "Failed to send applicant email",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get applicant by ID",
    description:
      "Retrieve a single applicant by ID (requires API key or JWE auth)",
  })
  @ApiParam({ name: "id", description: "Applicant ID" })
  @ApiResponse({ status: 200, description: "Applicant retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Applicant not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param("id") id: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`${identifier} accessing applicant ${id}`);

    try {
      const result = await firstValueFrom(
        this.applicantClient.send({ cmd: "applicant.findById" }, { id }).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              error.message || "Applicant not found",
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
        error.message || "Failed to fetch applicant",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get all applicants",
    description:
      "Retrieve paginated list of applicants with filters/sorting (requires API key or JWE auth)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "filters",
    required: false,
    type: String,
    description:
      'JSON array of FilterItem: [{"id":"name","value":"John","operator":"contains"}]',
  })
  @ApiQuery({
    name: "sorting",
    required: false,
    type: String,
    description: 'JSON array of SortItem: [{"id":"name","desc":false}]',
  })
  @ApiResponse({
    status: 200,
    description: "List of applicants retrieved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid filters or sorting format",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findAll(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("filters") filtersJson?: string,
    @Query("sorting") sortingJson?: string,
    @Req() request?: Request,
  ) {
    const authType = (request as any)?.authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`${identifier} listing applicants (page ${page})`);

    try {
      const filters = parseFilters(filtersJson);
      const sorting = parseSorting(sortingJson);
      const pagination = validatePagination(page, limit);

      this.logger.debug(`Filters: ${JSON.stringify(filters)}`);
      this.logger.debug(`Sorting: ${JSON.stringify(sorting)}`);
      this.logger.debug(`Pagination: ${JSON.stringify(pagination)}`);
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: "applicant.findAll" },
            {
              page: pagination.page,
              limit: pagination.limit,
              filters,
              sorting,
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to fetch applicants",
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
        "Failed to fetch applicants",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update applicant",
    description: "Update an existing applicant profile (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "Applicant ID" })
  @ApiBody({ type: UpdateApplicantDto })
  @ApiResponse({ status: 200, description: "Applicant updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Applicant not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() updateDto: UpdateApplicantDto,
  ) {
    this.logger.log(`User ${user.email} updating applicant ${id}`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send(
            { cmd: "applicant.update" },
            { id, updates: updateDto, userId: user.id },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to update applicant",
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
        error.message || "Failed to update applicant",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete applicant",
    description: "Delete an applicant profile (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "Applicant ID" })
  @ApiResponse({ status: 200, description: "Applicant deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Applicant not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    this.logger.log(`User ${user.email} deleting applicant ${id}`);
    try {
      const result = await firstValueFrom(
        this.applicantClient
          .send({ cmd: "applicant.delete" }, { id, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to delete applicant",
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
        error.message || "Failed to delete applicant",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
