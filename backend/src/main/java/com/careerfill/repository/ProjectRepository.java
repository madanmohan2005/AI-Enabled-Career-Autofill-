package com.careerfill.repository;

import com.careerfill.entity.Project;
import com.careerfill.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUser(User user);
    List<Project> findByUserId(Long userId);
}
