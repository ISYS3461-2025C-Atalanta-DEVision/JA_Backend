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
import { firstValueFrom, timeout, catchError } from "rxjs";
import { CreateJobApplicationDto, UpdateJobApplicationDto } from "../dtos";
import {
  parseFilters,
  parseSorting,
  validatePagination,
} from "../../../shared/utils/query-parser.util";

@ApiTags("JobApplication")
@Controller("jobApplication")
@UseGuards(EmailVerifiedGuard)
export class JobApplicationController {
  private readonly logger = new Logger(JobApplicationController.name);

  constructor(
    @Inject("JOB_APPLICATION_SERVICE") private readonly jobApplicationClient: ClientProxy,
  ) { }

  @Post()
  @ApiOperation({
    summary: "Create jobApplication",
    description: "Create a new jobApplication profile (requires JWE auth)",
  })
  @ApiBody({ type: CreateJobApplicationDto })
  @ApiResponse({ status: 201, description: "jobApplication created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateJobApplicationDto,
  ) {
    this.logger.log(`User ${user.email} creating jobApplication`);
    try {
      const result = await firstValueFrom(
        this.jobApplicationClient
          .send(
            { cmd: "jobApplication.create" },
            { createDto: createDto, applicantId: user.id },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.error(error);
              throw new HttpException(
                error.message || "jobApplication service unavailable",
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
        error.message || "Failed to create jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("applicant/:applicantId")
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get jobApplication by applicant ID",
    description:
      "Retrieve a list of jobApplication by applicant ID (requires API key or JWE auth)",
  })
  @ApiParam({ name: "applicantId", description: "Applicant ID" })
  @ApiResponse({ status: 200, description: "jobApplication retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "jobApplication not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findByApplicantId(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param("applicantId") applicantId: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`Getting Applicant ${applicantId} jobApplication`);

    try {
      const result = await firstValueFrom(
        this.jobApplicationClient
          .send(
            { cmd: "jobApplication.findByApplicantId" },
            { applicantId: applicantId },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "jobApplication not found",
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
        error.message || "Failed to fetch jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get jobApplication by ID",
    description:
      "Retrieve a single jobApplication by ID (requires API key or JWE auth)",
  })
  @ApiParam({ name: "id", description: "jobApplication ID" })
  @ApiResponse({ status: 200, description: "jobApplication retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "jobApplication not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param("id") id: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`${identifier} accessing jobApplication ${id}`);

    try {
      const result = await firstValueFrom(
        this.jobApplicationClient.send({ cmd: "jobApplication.findById" }, { id }).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              error.message || "jobApplication not found",
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
        error.message || "Failed to fetch jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get all jobApplication",
    description:
      "Retrieve paginated list of jobApplications (requires API key or JWE auth)",
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
      'JSON array of filters: [{"id":"fieldName","value":"searchValue","operator":"contains"}]',
  })
  @ApiQuery({
    name: "sorting",
    required: false,
    type: String,
    description: 'JSON array of sorting: [{"id":"fieldName","desc":true}]',
  })
  @ApiResponse({
    status: 200,
    description: "List of jobApplications retrieved successfully",
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
    const pagination = validatePagination(page, limit);
    this.logger.log(`${identifier} listing jobApplications (page ${pagination.page})`);

    try {
      const result = await firstValueFrom(
        this.jobApplicationClient
          .send(
            { cmd: "jobApplication.findAll" },
            {
              page: pagination.page,
              limit: pagination.limit,
              filters: parseFilters(filtersJson),
              sorting: parseSorting(sortingJson),
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to fetch jobApplication",
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
        "Failed to fetch jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update jobApplication",
    description: "Update an existing jobApplication profile (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "jobApplication ID" })
  @ApiBody({ type: UpdateJobApplicationDto })
  @ApiResponse({ status: 200, description: "JobApplication updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "jobApplication not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() updateDto: UpdateJobApplicationDto,
  ) {
    this.logger.log(`User ${user.email} updating jobApplication ${id}`);
    try {
      const result = await firstValueFrom(
        this.jobApplicationClient
          .send(
            { cmd: "jobApplication.update" },
            { id, updates: updateDto, userId: user.id },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to update jobApplication",
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
        error.message || "Failed to update jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete jobApplication",
    description: "Delete an jobApplication entry (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "jobApplication ID" })
  @ApiResponse({ status: 200, description: "jobApplication deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "jobApplication not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    this.logger.log(`User ${user.email} deleting jobApplication ${id}`);
    try {
      const result = await firstValueFrom(
        this.jobApplicationClient
          .send({ cmd: "jobApplication.delete" }, { id, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to delete jobApplication",
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
        error.message || "Failed to delete jobApplication",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
