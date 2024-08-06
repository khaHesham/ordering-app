import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderRequest } from './dto/create-order.request';
import { create } from 'domain';
import { OrdersRepository } from './orders.repository';
import { BILLING_SERVICE } from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: OrdersRepository,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy) { }


  async getOrders() {
    return this.orderRepository.find({});
  }

  async createOrder(request: CreateOrderRequest) {
    const session = await this.orderRepository.startTransaction();
    try {
      const order = await this.orderRepository.create(request, { session })
      await lastValueFrom(
        this.billingClient.emit('order_created', {
          request,
        }),
      )
      await session.commitTransaction();
      return order;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }

  }
}
