import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Document, SchemaOptions } from 'mongoose';
import { Location, LocationSchema } from './location.entity';

const options: SchemaOptions = {
  timestamps: true,
  versionKey: false,
};

@Schema(options)
export class Photo extends Document {
  @Prop({
    required: true,
    unique: true,
  })
  @IsString()
  @IsNotEmpty()
  photo_id: string;

  @Prop({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @Prop({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Prop({
    required: true,
  })
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @Prop({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  ext: string;

  @Prop({ type: LocationSchema, required: true })
  location: Location;

  readonly readOnlyData: {
    image_id: string;
    user_id: string;
    name: string;
    date: string;
  };
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
