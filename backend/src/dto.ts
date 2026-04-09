import { IsString, IsInt, Min, Max, IsEmail } from 'class-validator';
import { type User } from '../../common/types.js';

export class UserData implements User {
    @IsInt() @Min(2020000000) @Max(2027000000) student_id!: number;
    @IsInt() college_id!: number;
    @IsEmail() univ_mail!: string;
    @IsString() id!: string;
    @IsString() password!: string;
}