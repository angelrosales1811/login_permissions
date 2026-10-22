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

  @Column({
    type: 'uuid',
    nullable: true,
  })
  session_id?: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  token_family?: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  replaced_by?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  used_at?: Date;

  @Column({
    type: 'timestamptz',
  })
  expires_at!: Date;

  @Column({
    default: false,
  })
  revoked!: boolean;

  @Column({
    type: 'timestamptz',
  })
  created_at!: Date;

  @Column({
    nullable: true,
  })
  ip_creation?: string;
}
