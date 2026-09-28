package com.aksh.expensejar.controller;

import com.aksh.expensejar.dto.ExpenseRequest;
import com.aksh.expensejar.entity.Expense;
import com.aksh.expensejar.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    // ADD EXPENSE
    @PostMapping
    public ResponseEntity<Map<String, Object>> createExpense(
            @Valid @RequestBody ExpenseRequest request) {

        Expense expense = new Expense();

        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setDescription(request.getDescription());

        Expense savedExpense =
                expenseService.createExpense(
                        expense,
                        request.getUserId(),
                        request.getCategoryId()
                );

        String budgetAlert =
                expenseService.checkBudgetAlert(
                        request.getUserId(),
                        request.getCategoryId(),
                        request.getExpenseDate()
                );

        Map<String, Object> response =
                new java.util.LinkedHashMap<>();

        response.put("message", "Expense added successfully");
        response.put("expense", savedExpense);
        response.put("budgetAlert", budgetAlert);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // GET USER EXPENSES
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Expense>> getUserExpenses(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                expenseService.getExpensesByUser(userId)
        );
    }

    // GET EXPENSE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                expenseService.getExpenseById(id)
        );
    }

    // UPDATE EXPENSE
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request) {

        Expense expense = new Expense();

        expense.setAmount(request.getAmount());
        expense.setExpenseDate(request.getExpenseDate());
        expense.setDescription(request.getDescription());

        return ResponseEntity.ok(
                expenseService.updateExpense(
                        id,
                        expense,
                        request.getCategoryId()
                )
        );
    }

    // DELETE EXPENSE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id) {

        expenseService.deleteExpense(id);

        return ResponseEntity.noContent().build();
    }

    // CATEGORY SPENDING SUMMARY
    @GetMapping("/summary")
    public ResponseEntity<Map<String, BigDecimal>> getCategorySummary(
            @RequestParam Long userId,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        LocalDate start =
                LocalDate.parse(startDate);

        LocalDate end =
                LocalDate.parse(endDate);

        return ResponseEntity.ok(
                expenseService.getCategorySpending(
                        userId,
                        start,
                        end
                )
        );
    }

    // MONTHLY SPENDING
    @GetMapping("/monthly")
    public ResponseEntity<BigDecimal> getMonthlySpending(
            @RequestParam Long userId,
            @RequestParam int year,
            @RequestParam int month) {

        return ResponseEntity.ok(
                expenseService.getMonthlySpending(
                        userId,
                        year,
                        month
                )
        );
    }

    // MONTH-OVER-MONTH TREND
    @GetMapping("/trend")
    public ResponseEntity<Map<String, BigDecimal>> getMonthlyTrend(
            @RequestParam Long userId,
            @RequestParam int year,
            @RequestParam int month) {

        return ResponseEntity.ok(
                expenseService.getMonthlyTrend(
                        userId,
                        year,
                        month
                )
        );
    }

    // CHECK BUDGET ALERT
    @GetMapping("/budget-alert")
    public ResponseEntity<String> checkBudgetAlert(
            @RequestParam Long userId,
            @RequestParam Long categoryId,
            @RequestParam String date) {

        LocalDate expenseDate =
                LocalDate.parse(date);

        return ResponseEntity.ok(
                expenseService.checkBudgetAlert(
                        userId,
                        categoryId,
                        expenseDate
                )
        );
    }
}