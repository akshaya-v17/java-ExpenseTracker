package com.aksh.expensejar.service;

import com.aksh.expensejar.entity.Budget;
import com.aksh.expensejar.entity.Category;
import com.aksh.expensejar.entity.Expense;
import com.aksh.expensejar.entity.User;
import com.aksh.expensejar.repository.BudgetRepository;
import com.aksh.expensejar.repository.CategoryRepository;
import com.aksh.expensejar.repository.ExpenseRepository;
import com.aksh.expensejar.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            BudgetRepository budgetRepository) {

        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
    }

    // ADD EXPENSE
    public Expense createExpense(
            Expense expense,
            Long userId,
            Long categoryId) {

        if (expense.getAmount() == null ||
                expense.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Expense amount must be greater than zero");
        }

        if (expense.getExpenseDate() == null) {
            throw new IllegalArgumentException(
                    "Expense date is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + userId));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + categoryId));

        expense.setUser(user);
        expense.setCategory(category);

        Expense savedExpense = expenseRepository.save(expense);

        checkBudgetAlert(
                userId,
                categoryId,
                expense.getExpenseDate()
        );

        return savedExpense;
    }

    // GET ALL EXPENSES FOR A USER
    public List<Expense> getExpensesByUser(Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + userId));

        return expenseRepository.findByUserId(userId);
    }

    // GET EXPENSE BY ID
    public Expense getExpenseById(Long id) {

        return expenseRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Expense not found with id: " + id));
    }

    // UPDATE EXPENSE
    public Expense updateExpense(
            Long id,
            Expense updatedExpense,
            Long categoryId) {

        Expense existingExpense = getExpenseById(id);

        if (updatedExpense.getAmount() == null ||
                updatedExpense.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Expense amount must be greater than zero");
        }

        if (updatedExpense.getExpenseDate() == null) {
            throw new IllegalArgumentException(
                    "Expense date is required");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + categoryId));

        existingExpense.setAmount(updatedExpense.getAmount());
        existingExpense.setExpenseDate(
                updatedExpense.getExpenseDate());
        existingExpense.setDescription(
                updatedExpense.getDescription());
        existingExpense.setCategory(category);

        Expense savedExpense = expenseRepository.save(existingExpense);

        checkBudgetAlert(
                existingExpense.getUser().getId(),
                categoryId,
                existingExpense.getExpenseDate()
        );

        return savedExpense;
    }

    // DELETE EXPENSE
    public void deleteExpense(Long id) {

        Expense expense = getExpenseById(id);

        expenseRepository.delete(expense);
    }

    // CATEGORY SPENDING SUMMARY
    public Map<String, BigDecimal> getCategorySpending(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        List<Expense> expenses =
                expenseRepository.findByUserIdAndExpenseDateBetween(
                        userId,
                        startDate,
                        endDate
                );

        Map<String, BigDecimal> summary =
                new LinkedHashMap<>();

        for (Expense expense : expenses) {

            String categoryName =
                    expense.getCategory().getName();

            summary.put(
                    categoryName,
                    summary.getOrDefault(
                            categoryName,
                            BigDecimal.ZERO
                    ).add(expense.getAmount())
            );
        }

        return summary;
    }

    // MONTHLY SPENDING
    public BigDecimal getMonthlySpending(
            Long userId,
            int year,
            int month) {

        LocalDate startDate =
                LocalDate.of(year, month, 1);

        LocalDate endDate =
                startDate.withDayOfMonth(
                        startDate.lengthOfMonth());

        return expenseRepository.getTotalForPeriod(
                userId,
                startDate,
                endDate
        );
    }

    // 90% BUDGET ALERT
    public String checkBudgetAlert(
            Long userId,
            Long categoryId,
            LocalDate expenseDate) {

        LocalDate monthStart =
                expenseDate.withDayOfMonth(1);

        LocalDate monthEnd =
                expenseDate.withDayOfMonth(
                        expenseDate.lengthOfMonth());

        Budget budget =
                budgetRepository
                        .findByUserIdAndCategoryIdAndBudgetMonth(
                                userId,
                                categoryId,
                                monthStart
                        )
                        .orElse(null);

        if (budget == null) {
            return "No budget set for this category.";
        }

        BigDecimal spent =
                expenseRepository.getCategoryTotalForPeriod(
                        userId,
                        categoryId,
                        monthStart,
                        monthEnd
                );

        BigDecimal alertLimit =
                budget.getAmount()
                        .multiply(new BigDecimal("0.90"))
                        .setScale(2, RoundingMode.HALF_UP);

        if (spent.compareTo(alertLimit) >= 0) {

            return "WARNING: Spending has reached 90% or more of the monthly budget.";
        }

        return "Budget is within the safe limit.";
    }

    // MONTH-OVER-MONTH TREND
    public Map<String, BigDecimal> getMonthlyTrend(
            Long userId,
            int year,
            int month) {

        Map<String, BigDecimal> trend =
                new LinkedHashMap<>();

        LocalDate currentMonth =
                LocalDate.of(year, month, 1);

        LocalDate previousMonth =
                currentMonth.minusMonths(1);

        BigDecimal currentTotal =
                getMonthlySpending(
                        userId,
                        currentMonth.getYear(),
                        currentMonth.getMonthValue()
                );

        BigDecimal previousTotal =
                getMonthlySpending(
                        userId,
                        previousMonth.getYear(),
                        previousMonth.getMonthValue()
                );

        trend.put(
                previousMonth.getYear()
                        + "-"
                        + String.format(
                        "%02d",
                        previousMonth.getMonthValue()),
                previousTotal
        );

        trend.put(
                currentMonth.getYear()
                        + "-"
                        + String.format(
                        "%02d",
                        currentMonth.getMonthValue()),
                currentTotal
        );

        return trend;
    }
}