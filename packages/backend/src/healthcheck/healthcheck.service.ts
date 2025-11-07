import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createSupabaseClient } from '../clients.js';

@Injectable()
export class HealthcheckService {
  async check() {
    const supabase = createSupabaseClient();

    if (!supabase) {
      return {
        status: 'error',
        message: 'Supabase client not initialized',
      };
    }

    try {
      // Test connection
      const { error: connectionError } = await supabase
        .from('bots')
        .select('*')
        .limit(0);

      if (
        connectionError &&
        connectionError.code !== 'PGRST116' &&
        connectionError.code !== '42P01'
      ) {
        throw connectionError;
      }

      // Query bots table
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .limit(10);

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return {
            status: 'ok',
            message: 'Connection successful, but bots table does not exist',
            bots: [],
          };
        }
        throw error;
      }

      return {
        status: 'ok',
        message: 'Health check successful',
        bots: data || [],
      };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      throw new HttpException(
        err.message || 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
