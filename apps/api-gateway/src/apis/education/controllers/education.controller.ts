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
import { CreateEducationDto, UpdateEducationDto } from "../dtos";
import {
  parseFilters,
  parseSorting,
  validatePagination,
} from "../../../shared/utils/query-parser.util";

@ApiTags("Education")
@Controller("education")
@UseGuards(EmailVerifiedGuard)
export class EducationController {
  private readonly logger = new Logger(EducationController.name);

  constructor(
    @Inject("EDUCATION_SERVICE") private readonly educationClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create education",
    description: "Create a new education profile (requires JWE auth)",
  })
  @ApiBody({ type: CreateEducationDto })
  @ApiResponse({ status: 201, description: "education created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateEducationDto,
  ) {
    this.logger.log(`User ${user.email} creating education`);
    try {
      const result = await firstValueFrom(
        this.educationClient
          .send(
            { cmd: "education.create" },
            { createDto: createDto, applicantId: user.id },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.error(error);
              throw new HttpException(
                error.message || "education service unavailable",
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
        error.message || "Failed to create education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get education by ID",
    description:
      "Retrieve a single education by ID (requires API key or JWE auth)",
  })
  @ApiParam({ name: "id", description: "education ID" })
  @ApiResponse({ status: 200, description: "education retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "education not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param("id") id: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`${identifier} accessing education ${id}`);

    try {
      const result = await firstValueFrom(
        this.educationClient.send({ cmd: "education.findById" }, { id }).pipe(
          timeout(5000),
          catchError((error) => {
            throw new HttpException(
              error.message || "education not found",
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
        error.message || "Failed to fetch education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("applicant/:applicantId")
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get education by applicant ID",
    description:
      "Retrieve a list of education by applicant ID (requires API key or JWE auth)",
  })
  @ApiParam({ name: "applicantId", description: "Applicant ID" })
  @ApiResponse({ status: 200, description: "education retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "education not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async findByApplicantId(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param("applicantId") applicantId: string,
    @Req() request: Request,
  ) {
    const authType = (request as any).authType || "jwt";
    const identifier = authType === "jwt" && user ? user.email : "API Key";
    this.logger.log(`Getting Applicant ${applicantId} education`);

    try {
      const result = await firstValueFrom(
        this.educationClient
          .send(
            { cmd: "education.findByApplicantId" },
            { applicantId: applicantId },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "education not found",
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
        error.message || "Failed to fetch education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiKeyAuth()
  @ApiOperation({
    summary: "Get all education",
    description:
      "Retrieve paginated list of educations (requires API key or JWE auth)",
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
    description: "List of educations retrieved successfully",
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
    this.logger.log(`${identifier} listing educations (page ${pagination.page})`);

    try {
      const result = await firstValueFrom(
        this.educationClient
          .send(
            { cmd: "education.findAll" },
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
                error.message || "Failed to fetch education",
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
        "Failed to fetch education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update education",
    description: "Update an existing education profile (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "education ID" })
  @ApiBody({ type: UpdateEducationDto })
  @ApiResponse({ status: 200, description: "Education updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "education not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() updateDto: UpdateEducationDto,
  ) {
    this.logger.log(`User ${user.email} updating education ${id}`);
    try {
      const result = await firstValueFrom(
        this.educationClient
          .send(
            { cmd: "education.update" },
            { id, updates: updateDto, userId: user.id },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to update education",
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
        error.message || "Failed to update education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete education",
    description: "Delete an education entry (requires JWE auth)",
  })
  @ApiParam({ name: "id", description: "education ID" })
  @ApiResponse({ status: 200, description: "education deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "education not found" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    this.logger.log(`User ${user.email} deleting education ${id}`);
    try {
      const result = await firstValueFrom(
        this.educationClient
          .send({ cmd: "education.delete" }, { id, userId: user.id })
          .pipe(
            timeout(5000),
            catchError((error) => {
              throw new HttpException(
                error.message || "Failed to delete education",
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
        error.message || "Failed to delete education",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
