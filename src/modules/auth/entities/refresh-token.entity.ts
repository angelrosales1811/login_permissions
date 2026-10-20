import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'security',
  name: 'refresh_tokens',
})
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  user_id!: string;

  @Column()
  token_hash!: string;

  @Column()
  expires_at!: Date;

  @Column()
  revoked!: boolean;
}
