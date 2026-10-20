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

  @Column({
    type: 'text',
  })
  token_hash!: string;

  @Column({
    type: 'timestamptz',
  })
  expires_at!: Date;

  @Column({
    default: false,
  })
  revoked!: boolean;
}
