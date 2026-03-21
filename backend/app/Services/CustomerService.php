<?php

namespace App\Services;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CustomerService
{
    /**
     * Create and persist a new customer account with linked profile.
     */
    public function createNewCustomer(StoreCustomerRequest $request): Customer
    {
        $data = $request->validatedSnake();

        return DB::transaction(function () use ($data): Customer {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => User::ROLE_CUSTOMER,
            ]);

            return Customer::query()->create([
                'user_id' => $user->id,
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'house_no' => $data['house_no'],
                'street_name' => $data['street_name'],
                'city' => $data['city'],
                'zip_code' => $data['zip_code'],
                'phone' => $data['phone'],
                'credit_limit' => $data['credit_limit'],
            ]);
        });
    }
}
