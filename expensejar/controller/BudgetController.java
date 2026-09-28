package com.aksh.expensejar.controller;

import com.aksh.expensejar.dto.BudgetRequest;
import com.aksh.expensejar.entity.Budget;
import com.aksh.expensejar.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    // CREATE BUDGET
    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @Valid @RequestBody BudgetRequest request) {

        Budget budget = new Budget();

        budget.setAmount(request.getAmount());
        budget.setBudgetMonth(request.getBudgetMonth());

        Budget savedBudget =
                budgetService.createBudget(
                        budget,
                        request.getUserId(),
                        request.getCategoryId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedBudget);
    }

    // GET USER BUDGETS
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Budget>> getUserBudgets(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                budgetService.getBudgetsByUser(userId)
        );
    }

    // GET BUDGET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Budget> getBudgetById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                budgetService.getBudgetById(id)
        );
    }

    // UPDATE BUDGET
    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request) {

        Budget budget = new Budget();

        budget.setAmount(request.getAmount());
        budget.setBudgetMonth(request.getBudgetMonth());

        return ResponseEntity.ok(
                budgetService.updateBudget(
                        id,
                        budget
                )
        );
    }

    // DELETE BUDGET
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id) {

        budgetService.deleteBudget(id);

        return ResponseEntity.noContent().build();
    }
}