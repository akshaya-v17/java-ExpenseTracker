package com.aksh.expensejar.service;

import com.aksh.expensejar.entity.Budget;
import com.aksh.expensejar.entity.Category;
import com.aksh.expensejar.entity.User;
import com.aksh.expensejar.repository.BudgetRepository;
import com.aksh.expensejar.repository.CategoryRepository;
import com.aksh.expensejar.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public BudgetService(
            BudgetRepository budgetRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {

        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    // CREATE BUDGET
    public Budget createBudget(
            Budget budget,
            Long userId,
            Long categoryId) {

        if (budget.getAmount() == null ||
                budget.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Budget amount must be greater than zero");
        }

        if (budget.getBudgetMonth() == null) {
            throw new IllegalArgumentException(
                    "Budget month is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + userId));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + categoryId));

        LocalDate monthStart =
                budget.getBudgetMonth().withDayOfMonth(1);

        if (budgetRepository
                .findByUserIdAndCategoryIdAndBudgetMonth(
                        userId,
                        categoryId,
                        monthStart
                ).isPresent()) {

            throw new IllegalArgumentException(
                    "Budget already exists for this category and month");
        }

        budget.setBudgetMonth(monthStart);
        budget.setUser(user);
        budget.setCategory(category);

        return budgetRepository.save(budget);
    }

    // GET ALL BUDGETS
    public List<Budget> getBudgetsByUser(Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + userId));

        return budgetRepository.findByUserId(userId);
    }

    // GET BUDGET BY ID
    public Budget getBudgetById(Long id) {

        return budgetRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Budget not found with id: " + id));
    }

    // UPDATE BUDGET
    public Budget updateBudget(
            Long id,
            Budget updatedBudget) {

        Budget existingBudget =
                getBudgetById(id);

        if (updatedBudget.getAmount() == null ||
                updatedBudget.getAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Budget amount must be greater than zero");
        }

        existingBudget.setAmount(
                updatedBudget.getAmount());

        if (updatedBudget.getBudgetMonth() != null) {

            existingBudget.setBudgetMonth(
                    updatedBudget
                            .getBudgetMonth()
                            .withDayOfMonth(1)
            );
        }

        return budgetRepository.save(existingBudget);
    }

    // DELETE BUDGET
    public void deleteBudget(Long id) {

        Budget budget = getBudgetById(id);

        budgetRepository.delete(budget);
    }
}