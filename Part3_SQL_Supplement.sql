-- =====================================================================
-- SUPPLEMENT TO Part3_SQL_Implementation.sql
-- Fills the gaps against the Lab Cycle Sheet topics:
--   3 : SQL Functions        4 : Joins / Subqueries / Views
--   5 : PL/SQL control structures + cursors     7 : Triggers
-- Run AFTER the main script (tables and sample data must exist).
-- =====================================================================
SET SERVEROUTPUT ON;

-- =====================================================================
-- CYCLE 3 : SQL FUNCTIONS (character, numeric, date, conversion, null)
-- =====================================================================
-- Character functions
SELECT INITCAP('wayanad landslide') AS Initcap_Demo,
       LOWER('FLOOD') AS Lower_Demo,
       UPPER('cyclone') AS Upper_Demo,
       CONCAT('Drone-', 301) AS Concat_Demo,
       SUBSTR('Velachery',1,4) AS Substr_Demo,
       INSTR('Velachery','c') AS Instr_Demo,
       LPAD('42',6,'0') AS Lpad_Demo,
       RPAD('Camp',8,'*') AS Rpad_Demo,
       REPLACE('Relief Camp','Camp','Centre') AS Replace_Demo,
       LENGTH('Relief Camp') AS Length_Demo,
       TRIM('  Mission  ') AS Trim_Demo
FROM   DUAL;

-- Same functions on table data
SELECT UPPER(AreaName) AS Area, LOWER(District) AS District, LENGTH(AreaName) AS Len FROM Location;
SELECT FirstName || ' ' || LastName AS FullName, SUBSTR(LicenseNo,-4) AS License_Last4 FROM Operator;

-- Numeric functions
SELECT ROUND(123.4567,2) AS Round_Demo, TRUNC(123.4567,1) AS Trunc_Demo,
       CEIL(4.2) AS Ceil_Demo, FLOOR(4.8) AS Floor_Demo,
       MOD(17,5) AS Mod_Demo, POWER(2,5) AS Power_Demo,
       SQRT(81) AS Sqrt_Demo, ABS(-45) AS Abs_Demo, SIGN(-9) AS Sign_Demo
FROM   DUAL;

SELECT SupplyType, QuantityAvailable, ROUND(QuantityAvailable/12,1) AS Dozens,
       MOD(QuantityAvailable,100) AS Remainder
FROM   Supply;

-- Date functions
SELECT SYSDATE AS Today,
       ADD_MONTHS(SYSDATE,3) AS After_3_Months,
       LAST_DAY(SYSDATE) AS Month_End,
       NEXT_DAY(SYSDATE,'MONDAY') AS Next_Monday,
       MONTHS_BETWEEN(SYSDATE, DATE '2026-01-01') AS Months_Elapsed
FROM   DUAL;

SELECT MissionID, MissionDate, TO_CHAR(MissionDate,'DD-Mon-YYYY') AS Formatted,
       TO_CHAR(MissionDate,'Day') AS Weekday, TRUNC(SYSDATE - MissionDate) AS Days_Ago
FROM   Mission;

-- Conversion functions
SELECT TO_CHAR(1234567.891,'9,999,999.99') AS To_Char_Num,
       TO_DATE('15-AUG-2026','DD-MON-YYYY') AS To_Date_Demo,
       TO_NUMBER('250') + 50 AS To_Number_Demo
FROM   DUAL;

-- NULL handling and conditional functions
SELECT DisasterName, NVL(TO_CHAR(EndDate,'DD-MON-YYYY'),'Ongoing') AS EndDate_Shown,
       NVL2(EndDate,'Ended','Active') AS Phase,
       COALESCE(EndDate, SYSDATE) AS Effective_End
FROM   Disaster;

SELECT DroneID, BatteryLevel,
       DECODE(Status,'Available','Ready','On Mission','Busy','Under Maintenance','Service','Unknown') AS Status_Code,
       CASE WHEN BatteryLevel >= 80 THEN 'High'
            WHEN BatteryLevel >= 40 THEN 'Medium'
            ELSE 'Low' END AS Battery_Band
FROM   Drone;

-- Aggregate functions with GROUP BY
SELECT State, COUNT(*) AS Locations, MAX(Latitude) AS Max_Lat
FROM   Location GROUP BY State;

-- =====================================================================
-- CYCLE 4 : JOINS, SUB-QUERIES, VIEWS (additional forms)
-- =====================================================================
-- Join variants
SELECT d.DisasterName, l.AreaName FROM Disaster d NATURAL JOIN Location l;          -- natural join on LocationID
SELECT d.DisasterName, l.District FROM Disaster d JOIN Location l USING (LocationID);
SELECT o.FirstName, dr.DroneID FROM Operator o CROSS JOIN Drone dr WHERE o.OperatorID = 101;
SELECT l.AreaName, w.Rainfall, w.WindSpeed
FROM   Location l JOIN Weather_Report w ON l.LocationID = w.LocationID
WHERE  w.Rainfall > 150;

-- Sub-queries: ANY / ALL
SELECT DroneID, BatteryLevel FROM Drone
WHERE  BatteryLevel > ALL (SELECT BatteryLevel FROM Drone WHERE Status = 'Under Maintenance');

SELECT DisasterName, SeverityLevel FROM Disaster
WHERE  DisasterID = ANY (SELECT DisasterID FROM Mission WHERE Priority = 'Critical');

-- Correlated sub-query: victims older than average age of their own disaster
SELECT v.VictimName, v.DisasterID
FROM   Victim v
WHERE  v.DateOfBirth < (SELECT AVG(v2.DateOfBirth - DATE '1900-01-01') + DATE '1900-01-01'
                        FROM   Victim v2 WHERE v2.DisasterID = v.DisasterID);

-- Nested sub-query: operators who flew drones that had maintenance
SELECT FirstName, LastName FROM Operator
WHERE  OperatorID IN (SELECT OperatorID FROM Drone
                      WHERE  DroneID IN (SELECT DroneID FROM Maintenance_Record));

-- Sub-query in FROM (inline view): top disasters by mission count
SELECT *
FROM  (SELECT DisasterID, COUNT(*) AS Missions FROM Mission GROUP BY DisasterID ORDER BY Missions DESC)
WHERE ROWNUM <= 2;

-- Views: join view, WITH CHECK OPTION, update through view, drop
CREATE OR REPLACE VIEW Mission_Detail_View AS
SELECT m.MissionID, m.MissionType, m.MissionDate, m.MissionStatus,
       d.DisasterName, dr.Model AS DroneModel, o.FirstName AS OperatorName
FROM   Mission m
JOIN   Disaster d ON m.DisasterID = d.DisasterID
JOIN   Drone dr   ON m.DroneID    = dr.DroneID
JOIN   Operator o ON m.OperatorID = o.OperatorID;
SELECT * FROM Mission_Detail_View;

CREATE OR REPLACE VIEW Available_Drones AS
SELECT DroneID, Model, BatteryLevel, Status FROM Drone
WHERE  Status = 'Available' WITH CHECK OPTION;

UPDATE Available_Drones SET BatteryLevel = 90 WHERE DroneID = 305;     -- allowed, row still satisfies view
UPDATE Available_Drones SET Status = 'On Mission' WHERE DroneID = 305; -- fails: WITH CHECK OPTION violated
ROLLBACK;

SELECT view_name FROM user_views;
DROP VIEW Available_Drones;

-- =====================================================================
-- CYCLE 5 : PL/SQL CONTROL STRUCTURES AND CURSORS
-- =====================================================================
-- 5.1 Variables, %TYPE, IF - ELSIF - ELSE
DECLARE
    v_bat    Drone.BatteryLevel%TYPE;
    v_status VARCHAR2(30);
BEGIN
    SELECT BatteryLevel INTO v_bat FROM Drone WHERE DroneID = 301;
    IF v_bat >= 80 THEN
        v_status := 'Fully ready for deployment';
    ELSIF v_bat >= 40 THEN
        v_status := 'Deployable for short missions';
    ELSE
        v_status := 'Needs charging';
    END IF;
    DBMS_OUTPUT.PUT_LINE('Drone 301 battery ' || v_bat || '% : ' || v_status);
END;
/

-- 5.2 CASE statement and %ROWTYPE
DECLARE
    r_dis   Disaster%ROWTYPE;
    v_resp  VARCHAR2(50);
BEGIN
    SELECT * INTO r_dis FROM Disaster WHERE DisasterID = 501;
    CASE r_dis.SeverityLevel
        WHEN 'Critical' THEN v_resp := 'Deploy all drones and NDRF teams';
        WHEN 'High'     THEN v_resp := 'Deploy rescue drones';
        WHEN 'Medium'   THEN v_resp := 'Surveillance only';
        ELSE                 v_resp := 'Monitor';
    END CASE;
    DBMS_OUTPUT.PUT_LINE(r_dis.DisasterName || ' -> ' || v_resp);
END;
/

-- 5.3 Loops : basic LOOP, WHILE, FOR
DECLARE
    v_i NUMBER := 1;
BEGIN
    LOOP                                            -- basic loop with EXIT WHEN
        DBMS_OUTPUT.PUT_LINE('Basic loop, drone check number ' || v_i);
        v_i := v_i + 1;
        EXIT WHEN v_i > 3;
    END LOOP;
END;
/

DECLARE
    v_id    NUMBER := 901;
    v_name  Supply.SupplyType%TYPE;
    v_total NUMBER := 0;
    v_qty   Supply.QuantityAvailable%TYPE;
BEGIN
    WHILE v_id <= 905 LOOP                          -- WHILE loop over supply IDs
        SELECT SupplyType, QuantityAvailable INTO v_name, v_qty FROM Supply WHERE SupplyID = v_id;
        v_total := v_total + v_qty;
        DBMS_OUTPUT.PUT_LINE(v_name || ' : ' || v_qty);
        v_id := v_id + 1;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Total items in stock = ' || v_total);
END;
/

BEGIN
    FOR i IN 1..3 LOOP                              -- numeric FOR loop
        DBMS_OUTPUT.PUT_LINE('Relief round ' || i);
    END LOOP;
    FOR i IN REVERSE 1..3 LOOP
        DBMS_OUTPUT.PUT_LINE('Countdown ' || i);
    END LOOP;
END;
/

-- 5.4 Exception handling (predefined and user-defined)
DECLARE
    v_qty        Supply.QuantityAvailable%TYPE;
    e_insuff     EXCEPTION;
    c_required   CONSTANT NUMBER := 10000;
BEGIN
    SELECT QuantityAvailable INTO v_qty FROM Supply WHERE SupplyID = 902;
    IF v_qty < c_required THEN
        RAISE e_insuff;
    END IF;
EXCEPTION
    WHEN e_insuff THEN
        DBMS_OUTPUT.PUT_LINE('Insufficient stock: only ' || v_qty || ' available');
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Supply item not found');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
END;
/

-- 5.5 Implicit cursor attributes
BEGIN
    UPDATE Drone SET BatteryLevel = 100 WHERE Status = 'Available';
    IF SQL%FOUND THEN
        DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' drone(s) recharged');
    ELSE
        DBMS_OUTPUT.PUT_LINE('No drone updated');
    END IF;
    ROLLBACK;
END;
/

-- 5.6 Explicit cursor : OPEN - FETCH - CLOSE with %NOTFOUND, %ROWCOUNT, %ISOPEN
DECLARE
    CURSOR c_crit IS
        SELECT VictimID, VictimName, MedicalPriority
        FROM   Victim WHERE MedicalPriority IN ('High','Critical');
    r_v c_crit%ROWTYPE;
BEGIN
    OPEN c_crit;
    IF c_crit%ISOPEN THEN DBMS_OUTPUT.PUT_LINE('Cursor opened'); END IF;
    LOOP
        FETCH c_crit INTO r_v;
        EXIT WHEN c_crit%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(c_crit%ROWCOUNT || '. ' || r_v.VictimName || ' (' || r_v.MedicalPriority || ')');
    END LOOP;
    CLOSE c_crit;
END;
/

-- 5.7 Parameterised cursor with cursor FOR loop
DECLARE
    CURSOR c_mis (p_dis NUMBER) IS
        SELECT MissionID, MissionType, MissionStatus FROM Mission WHERE DisasterID = p_dis;
BEGIN
    FOR r IN c_mis(501) LOOP
        DBMS_OUTPUT.PUT_LINE('Mission ' || r.MissionID || ' : ' || r.MissionType || ' [' || r.MissionStatus || ']');
    END LOOP;
END;
/

-- 5.8 Cursor with FOR UPDATE / WHERE CURRENT OF : recharge low-battery drones
DECLARE
    CURSOR c_low IS SELECT DroneID, BatteryLevel FROM Drone WHERE BatteryLevel < 50 FOR UPDATE;
BEGIN
    FOR r IN c_low LOOP
        UPDATE Drone SET BatteryLevel = 100 WHERE CURRENT OF c_low;
        DBMS_OUTPUT.PUT_LINE('Drone ' || r.DroneID || ' recharged');
    END LOOP;
    COMMIT;
END;
/

-- =====================================================================
-- CYCLE 7 : TRIGGERS (statement-level, row-level, BEFORE/AFTER, :OLD/:NEW)
-- (trg_drone_on_mission and trg_low_battery were created in the main script)
-- =====================================================================
-- Audit table
CREATE TABLE Drone_Audit (
    AuditID    NUMBER        PRIMARY KEY,
    DroneID    NUMBER,
    OldStatus  VARCHAR2(20),
    NewStatus  VARCHAR2(20),
    ChangedOn  TIMESTAMP DEFAULT SYSTIMESTAMP,
    ChangedBy  VARCHAR2(30)
);
CREATE SEQUENCE seq_audit START WITH 1 INCREMENT BY 1 NOCACHE;

-- 7.1 AFTER UPDATE row-level trigger using :OLD and :NEW (audit log)
CREATE OR REPLACE TRIGGER trg_drone_audit
AFTER UPDATE OF Status ON Drone
FOR EACH ROW
WHEN (OLD.Status <> NEW.Status)
BEGIN
    INSERT INTO Drone_Audit (AuditID, DroneID, OldStatus, NewStatus, ChangedBy)
    VALUES (seq_audit.NEXTVAL, :OLD.DroneID, :OLD.Status, :NEW.Status, USER);
END;
/
UPDATE Drone SET Status = 'Under Maintenance' WHERE DroneID = 304;
SELECT * FROM Drone_Audit;
ROLLBACK;

-- 7.2 BEFORE DELETE trigger : an active disaster cannot be deleted
CREATE OR REPLACE TRIGGER trg_no_delete_active
BEFORE DELETE ON Disaster
FOR EACH ROW
BEGIN
    IF :OLD.Status = 'Active' THEN
        RAISE_APPLICATION_ERROR(-20002, 'Cannot delete a disaster that is still Active');
    END IF;
END;
/
DELETE FROM Disaster WHERE DisasterID = 501;     -- fails with ORA-20002
ROLLBACK;

-- 7.3 BEFORE UPDATE trigger : stock can never go negative (friendly message)
CREATE OR REPLACE TRIGGER trg_supply_stock
BEFORE UPDATE OF QuantityAvailable ON Supply
FOR EACH ROW
BEGIN
    IF :NEW.QuantityAvailable < 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Insufficient stock for supply ' || :OLD.SupplyID);
    END IF;
END;
/
UPDATE Supply SET QuantityAvailable = QuantityAvailable - 99999 WHERE SupplyID = 903;  -- fails
ROLLBACK;

-- 7.4 Statement-level trigger using INSERTING / UPDATING / DELETING
CREATE OR REPLACE TRIGGER trg_victim_dml
AFTER INSERT OR UPDATE OR DELETE ON Victim
BEGIN
    IF INSERTING THEN
        DBMS_OUTPUT.PUT_LINE('Victim table: INSERT performed');
    ELSIF UPDATING THEN
        DBMS_OUTPUT.PUT_LINE('Victim table: UPDATE performed');
    ELSIF DELETING THEN
        DBMS_OUTPUT.PUT_LINE('Victim table: DELETE performed');
    END IF;
END;
/
UPDATE Victim SET MedicalPriority = 'High' WHERE VictimID = 801;
ROLLBACK;

-- 7.5 BEFORE INSERT trigger : auto-generate VictimID from sequence if NULL
CREATE OR REPLACE TRIGGER trg_victim_id
BEFORE INSERT ON Victim
FOR EACH ROW
WHEN (NEW.VictimID IS NULL)
BEGIN
    :NEW.VictimID := seq_victim.NEXTVAL;
END;
/
INSERT INTO Victim (VictimName, DateOfBirth, Gender, MedicalPriority, CurrentStatus, DisasterID)
VALUES ('Test Victim', DATE '1999-09-09', 'M', 'Low', 'Missing', 504);
ROLLBACK;

-- Manage triggers
SELECT trigger_name, trigger_type, triggering_event, status FROM user_triggers;
ALTER TRIGGER trg_victim_dml DISABLE;
ALTER TRIGGER trg_victim_dml ENABLE;
-- DROP TRIGGER trg_victim_dml;
