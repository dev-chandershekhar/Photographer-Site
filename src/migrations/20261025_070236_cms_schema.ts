import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'replied', 'booked', 'archived');
  CREATE TYPE "public"."enum_social_posts_platform" AS ENUM('instagram', 'facebook');
  CREATE TYPE "public"."enum_social_posts_media_type" AS ENUM('image', 'video', 'carousel', 'text');
  CREATE TYPE "public"."enum_social_settings_layout" AS ENUM('tabs', 'combined');
  CREATE TYPE "public"."enum_social_settings_last_sync_status" AS ENUM('never', 'success', 'failed');
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"category_id" integer NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"price_from" numeric,
  	"currency" "enum_services_currency" DEFAULT 'USD',
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_name" varchar NOT NULL,
  	"quote" varchar NOT NULL,
  	"photo_id" integer,
  	"rating" numeric DEFAULT 5 NOT NULL,
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"event_date" timestamp(3) with time zone,
  	"session_type" varchar,
  	"message" varchar NOT NULL,
  	"status" "enum_inquiries_status" DEFAULT 'new' NOT NULL,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "social_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum_social_posts_platform" NOT NULL,
  	"external_id" varchar NOT NULL,
  	"permalink" varchar NOT NULL,
  	"caption" varchar,
  	"media_type" "enum_social_posts_media_type" NOT NULL,
  	"image_id" integer,
  	"posted_at" timestamp(3) with time zone NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"pinned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar NOT NULL,
  	"logo_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_id" integer,
  	"social_links_instagram" varchar,
  	"social_links_facebook" varchar,
  	"social_links_youtube" varchar,
  	"social_links_pinterest" varchar,
  	"social_links_x" varchar,
  	"contact_email" varchar NOT NULL,
  	"location" varchar,
  	"service_area" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hero" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"cta_text" varchar DEFAULT 'Get in touch',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hero_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "about_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"bio" jsonb,
  	"portrait_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "social_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Follow along',
  	"subheading" varchar,
  	"instagram_enabled" boolean DEFAULT false,
  	"facebook_enabled" boolean DEFAULT false,
  	"posts_to_show" numeric DEFAULT 8,
  	"layout" "enum_social_settings_layout" DEFAULT 'tabs',
  	"instagram_token" varchar,
  	"instagram_token_expires_at" timestamp(3) with time zone,
  	"facebook_page_id" varchar,
  	"facebook_page_token" varchar,
  	"last_sync_at" timestamp(3) with time zone,
  	"last_sync_status" "enum_social_settings_last_sync_status" DEFAULT 'never',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "media" ADD COLUMN "blur_data_u_r_l" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumb_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grid_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_full_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_full_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_full_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_full_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_full_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_full_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "photos_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "social_posts_id" integer;
  ALTER TABLE "photos" ADD CONSTRAINT "photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photos" ADD CONSTRAINT "photos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_features" ADD CONSTRAINT "services_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hero_rels" ADD CONSTRAINT "hero_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hero_rels" ADD CONSTRAINT "hero_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_stats" ADD CONSTRAINT "about_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about" ADD CONSTRAINT "about_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "photos_image_idx" ON "photos" USING btree ("image_id");
  CREATE INDEX "photos_category_idx" ON "photos" USING btree ("category_id");
  CREATE INDEX "photos_published_idx" ON "photos" USING btree ("published");
  CREATE INDEX "photos_updated_at_idx" ON "photos" USING btree ("updated_at");
  CREATE INDEX "photos_created_at_idx" ON "photos" USING btree ("created_at");
  CREATE INDEX "services_features_order_idx" ON "services_features" USING btree ("_order");
  CREATE INDEX "services_features_parent_id_idx" ON "services_features" USING btree ("_parent_id");
  CREATE INDEX "services_published_idx" ON "services" USING btree ("published");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX "testimonials_published_idx" ON "testimonials" USING btree ("published");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE INDEX "social_posts_platform_idx" ON "social_posts" USING btree ("platform");
  CREATE UNIQUE INDEX "social_posts_external_id_idx" ON "social_posts" USING btree ("external_id");
  CREATE INDEX "social_posts_image_idx" ON "social_posts" USING btree ("image_id");
  CREATE INDEX "social_posts_posted_at_idx" ON "social_posts" USING btree ("posted_at");
  CREATE INDEX "social_posts_hidden_idx" ON "social_posts" USING btree ("hidden");
  CREATE INDEX "social_posts_updated_at_idx" ON "social_posts" USING btree ("updated_at");
  CREATE INDEX "social_posts_created_at_idx" ON "social_posts" USING btree ("created_at");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_seo_seo_og_image_idx" ON "site_settings" USING btree ("seo_og_image_id");
  CREATE INDEX "hero_rels_order_idx" ON "hero_rels" USING btree ("order");
  CREATE INDEX "hero_rels_parent_idx" ON "hero_rels" USING btree ("parent_id");
  CREATE INDEX "hero_rels_path_idx" ON "hero_rels" USING btree ("path");
  CREATE INDEX "hero_rels_media_id_idx" ON "hero_rels" USING btree ("media_id");
  CREATE INDEX "about_stats_order_idx" ON "about_stats" USING btree ("_order");
  CREATE INDEX "about_stats_parent_id_idx" ON "about_stats" USING btree ("_parent_id");
  CREATE INDEX "about_portrait_idx" ON "about" USING btree ("portrait_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photos_fk" FOREIGN KEY ("photos_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_posts_fk" FOREIGN KEY ("social_posts_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_grid_sizes_grid_filename_idx" ON "media" USING btree ("sizes_grid_filename");
  CREATE INDEX "media_sizes_full_sizes_full_filename_idx" ON "media" USING btree ("sizes_full_filename");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_photos_id_idx" ON "payload_locked_documents_rels" USING btree ("photos_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_social_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("social_posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hero_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "photos" CASCADE;
  DROP TABLE "services_features" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "social_posts" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "hero" CASCADE;
  DROP TABLE "hero_rels" CASCADE;
  DROP TABLE "about_stats" CASCADE;
  DROP TABLE "about" CASCADE;
  DROP TABLE "social_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photos_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_inquiries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_social_posts_fk";
  
  DROP INDEX "media_sizes_thumb_sizes_thumb_filename_idx";
  DROP INDEX "media_sizes_grid_sizes_grid_filename_idx";
  DROP INDEX "media_sizes_full_sizes_full_filename_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_photos_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload_locked_documents_rels_inquiries_id_idx";
  DROP INDEX "payload_locked_documents_rels_social_posts_id_idx";
  ALTER TABLE "media" DROP COLUMN "blur_data_u_r_l";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_url";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_width";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_height";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_thumb_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_url";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_width";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_height";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_grid_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_full_url";
  ALTER TABLE "media" DROP COLUMN "sizes_full_width";
  ALTER TABLE "media" DROP COLUMN "sizes_full_height";
  ALTER TABLE "media" DROP COLUMN "sizes_full_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_full_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_full_filename";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "photos_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inquiries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "social_posts_id";
  DROP TYPE "public"."enum_services_currency";
  DROP TYPE "public"."enum_inquiries_status";
  DROP TYPE "public"."enum_social_posts_platform";
  DROP TYPE "public"."enum_social_posts_media_type";
  DROP TYPE "public"."enum_social_settings_layout";
  DROP TYPE "public"."enum_social_settings_last_sync_status";`)
}
